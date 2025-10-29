
import { VectorData } from '@/types/trajectory';
import * as THREE from 'three';

export function interpolatePosition(
  date: Date,
  trajectoryData: VectorData[]
): THREE.Vector3 {
  if (trajectoryData.length === 0) {
    return new THREE.Vector3(0, 0, 0);
  }

  const targetTime = date.getTime();
  let lowerIndex = -1;
  let upperIndex = -1;

  for (let i = 0; i < trajectoryData.length; i++) {
    const frameTime = new Date(trajectoryData[i].date).getTime();
    if (frameTime <= targetTime) {
      lowerIndex = i;
    } else {
      upperIndex = i;
      break;
    }
  }

  if (lowerIndex === -1) {
    const { x, y, z } = trajectoryData[0].position;
    return new THREE.Vector3(x, z, -y);
  }

  if (upperIndex === -1) {
    const { x, y, z } = trajectoryData[trajectoryData.length - 1].position;
    return new THREE.Vector3(x, z, -y);
  }

  const lowerFrame = trajectoryData[lowerIndex];
  const upperFrame = trajectoryData[upperIndex];
  const lowerTime = new Date(lowerFrame.date).getTime();
  const upperTime = new Date(upperFrame.date).getTime();

  if (upperTime === lowerTime) {
    const { x, y, z } = lowerFrame.position;
    return new THREE.Vector3(x, z, -y);
  }

  const t = (targetTime - lowerTime) / (upperTime - lowerTime);

  const lowerPosition = new THREE.Vector3(
    lowerFrame.position.x,
    lowerFrame.position.z,
    -lowerFrame.position.y
  );
  const upperPosition = new THREE.Vector3(
    upperFrame.position.x,
    upperFrame.position.z,
    -upperFrame.position.y
  );

  return new THREE.Vector3().lerpVectors(lowerPosition, upperPosition, t);
}
