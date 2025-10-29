
import * as fs from 'fs';
import * as path from 'path';

interface Vector {
  x: number;
  y: number;
  z: number;
}

interface VectorData {
  date: string;
  position: Vector;
  velocity: Vector;
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadTrajectoryData(filePath: string): VectorData[] {
  const absolutePath = path.resolve(__dirname, '..', 'public', 'data', filePath);
  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  const data = JSON.parse(fileContent);
  return data.atlas || data['3iatlas'] || data;
}

function calculatePhase(position: Vector): number {
  return Math.atan2(position.y, position.x);
}

function unwrapPhase(phases: number[]): number[] {
  const unwrappedPhases: number[] = [phases[0]];
  for (let i = 1; i < phases.length; i++) {
    let d = phases[i] - phases[i - 1];
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    unwrappedPhases.push(unwrappedPhases[i - 1] + d);
  }
  return unwrappedPhases;
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have the same length');
  }
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b) / n;
  const meanY = y.reduce((a, b) => a + b) / n;
  const stdDevX = Math.sqrt(x.map((xi) => (xi - meanX) ** 2).reduce((a, b) => a + b) / n);
  const stdDevY = Math.sqrt(y.map((yi) => (yi - meanY) ** 2).reduce((a, b) => a + b) / n);
  const covariance = x.map((xi, i) => (xi - meanX) * (y[i] - meanY)).reduce((a, b) => a + b) / n;
  return covariance / (stdDevX * stdDevY);
}

function runContinuityTest(data: VectorData[]) {
  const spliceDays = ['2025-09-07', '2025-09-08', '2025-11-14', '2025-11-15'];
  let passed = true;
  for (let i = 1; i < data.length; i++) {
    const d1 = new Date(data[i - 1].date);
    const d2 = new Date(data[i].date);
    const date1 = d1.toISOString().split('T')[0];
    const date2 = d2.toISOString().split('T')[0];
    if (
      (spliceDays.includes(date1) && spliceDays.includes(date2))
    ) {
      const p1 = data[i - 1].position;
      const p2 = data[i].position;
      const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
      if (distance > 0.1) {
        console.error(`Continuity test failed at ${date1} -> ${date2}: distance = ${distance}`);
        passed = false;
      }
    }
  }
  if (passed) {
    console.log('Continuity test passed!');
  }
}

function calculateDeltaPhiU(phases: number[]): number[] {
    const deltaPhiU: number[] = [0];
    for (let i = 1; i < phases.length; i++) {
        let d = phases[i] - phases[i - 1];
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        deltaPhiU.push(d);
    }
    return deltaPhiU;
}

function runIndependenceTest(solarSystemData: Record<string, VectorData[]>) {
    const jupiterData = solarSystemData.jupiter;
    if (!jupiterData) {
        console.warn('Jupiter data not found, skipping independence test.');
        return;
    }
    const jupiterDataMap = new Map<string, VectorData>();
    jupiterData.forEach(d => {
        const dateKey = new Date(d.date).toISOString().split('T')[0];
        jupiterDataMap.set(dateKey, d);
    });

    let passed = true;

    for (const planet in solarSystemData) {
        if (planet !== 'jupiter' && solarSystemData[planet]) {
            const planetData = solarSystemData[planet];
            const jupiterPhasesForCorr: number[] = [];
            const planetPhasesForCorr: number[] = [];

            planetData.forEach(p => {
                const dateKey = new Date(p.date).toISOString().split('T')[0];
                if (jupiterDataMap.has(dateKey)) {
                    const jupiterPoint = jupiterDataMap.get(dateKey)!;
                    jupiterPhasesForCorr.push(calculatePhase(jupiterPoint.position));
                    planetPhasesForCorr.push(calculatePhase(p.position));
                }
            });

            if (jupiterPhasesForCorr.length > 1) {
                const deltaJupiter = calculateDeltaPhiU(unwrapPhase(jupiterPhasesForCorr));
                const deltaPlanet = calculateDeltaPhiU(unwrapPhase(planetPhasesForCorr));
                const correlation = calculateCorrelation(deltaJupiter, deltaPlanet);
                if (Math.abs(correlation) > 0.8) {
                    console.error(`Independence test failed for ${planet}: correlation = ${correlation}`);
                    passed = false;
                }
            }
        }
    }
    if (passed) {
        console.log('Independence test passed!');
    }
}


const solarSystemPositions = loadTrajectoryData('SOLAR_SYSTEM_POSITIONS.json');
const trajectoryStatic = loadTrajectoryData('trajectory_static.json');

const mergedData: Record<string, VectorData[]> = {
    atlas: trajectoryStatic,
};

const planetKeys = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
planetKeys.forEach(planet => {
    mergedData[planet] = solarSystemPositions
        .filter((d: any) => d.object.toLowerCase().startsWith(planet))
        .map((d: any) => ({
            date: d.date,
            position: d.position_au,
            velocity: d.velocity_au_per_day,
        }));
});


runContinuityTest(mergedData.atlas);
runIndependenceTest(mergedData);

const orbitalPeriods: Record<string, number> = {
    mercury: 87.97,
    venus: 224.7,
    earth: 365.25,
    mars: 686.98,
    jupiter: 4332.59,
    saturn: 10759.22,
    uranus: 30688.5,
    neptune: 60182,
};

function runAngleWrapTest(data: Record<string, VectorData[]>) {
    let passed = true;
    for (const planet in data) {
        if (orbitalPeriods[planet]) {
            const planetData = data[planet];
            if (!planetData || planetData.length < 365) continue;

            const startIndex = 0;
            const endIndex = 365;
            const spanData = planetData.slice(startIndex, endIndex);

            const phases = unwrapPhase(spanData.map((d) => calculatePhase(d.position)));
            const cumulativeDeltaPhiU = phases[phases.length - 1] - phases[0];
            const expectedCumulativeDeltaPhiU = (2 * Math.PI) * (365 / orbitalPeriods[planet]);

            const error = Math.abs(cumulativeDeltaPhiU - expectedCumulativeDeltaPhiU) / expectedCumulativeDeltaPhiU;
            if (error > 0.2) { // Allow 20% tolerance
                console.error(`Angle wrap test failed for ${planet}: expected cumulative ΔphiU ≈ ${expectedCumulativeDeltaPhiU.toFixed(2)}, got ${cumulativeDeltaPhiU.toFixed(2)}`);
                passed = false;
            }
        }
    }
    if (passed) {
        console.log('Angle wrap test passed!');
    }
}

runAngleWrapTest(mergedData);
