import React, { useState, useEffect, useRef } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  Sun,
  Moon,
  Globe,
} from "lucide-react";

// --- Data ---
// All data is now included in this file to resolve the import error.

const celestialObjects = {
  sun: {
    name: "Sun",
    type: "Star",
    diameter: 1392700, // km
    mass: "1.989 × 10^30 kg",
    temperature: "5,505 °C",
    description:
      "The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core.",
    color: "#FFD700",
    orbitalPeriod: 0,
    distanceFromSun: 0,
    moons: [],
  },
  mercury: {
    name: "Mercury",
    type: "Planet",
    diameter: 4879,
    mass: "3.285 × 10^23 kg",
    temperature: "-173 to 427 °C",
    description:
      "Mercury is the smallest planet in the Solar System and nearest to the Sun. Its orbit takes 87.97 Earth days, the shortest of all the Sun's planets.",
    color: "#A9A9A9",
    orbitalPeriod: 88,
    distanceFromSun: 57.9, // million km
    moons: [],
  },
  venus: {
    name: "Venus",
    type: "Planet",
    diameter: 12104,
    mass: "4.867 × 10^24 kg",
    temperature: "462 °C",
    description:
      'Venus is the second planet from the Sun. It is a terrestrial planet and is sometimes called Earth\'s "sister planet" because of their similar size, mass, proximity to the Sun, and bulk composition.',
    color: "#FFA500",
    orbitalPeriod: 225,
    distanceFromSun: 108.2,
    moons: [],
  },
  earth: {
    name: "Earth",
    type: "Planet",
    diameter: 12742,
    mass: "5.972 × 10^24 kg",
    temperature: "-88 to 58 °C",
    description:
      "Our home planet, Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 29.2% of Earth's surface is land consisting of continents and islands.",
    color: "#4682B4",
    orbitalPeriod: 365,
    distanceFromSun: 149.6,
    moons: ["Moon"],
  },
  mars: {
    name: "Mars",
    type: "Planet",
    diameter: 6779,
    mass: "6.39 × 10^23 kg",
    temperature: "-153 to 20 °C",
    description:
      'Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System, being only larger than Mercury. In English, Mars carries the name of the Roman god of war and is often referred to as the "Red Planet".',
    color: "#E57373",
    orbitalPeriod: 687,
    distanceFromSun: 227.9,
    moons: ["Phobos", "Deimos"],
  },
  jupiter: {
    name: "Jupiter",
    type: "Gas Giant",
    diameter: 139820,
    mass: "1.898 × 10^27 kg",
    temperature: "-145 °C",
    description:
      "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass more than two and a half times that of all the other planets in the Solar System combined, but slightly less than one-thousandth the mass of the Sun.",
    color: "#D2B48C",
    orbitalPeriod: 4333,
    distanceFromSun: 778.5,
    moons: ["Io", "Europa", "Ganymede", "Callisto", "...and 75+ more"],
  },
  saturn: {
    name: "Saturn",
    type: "Gas Giant",
    diameter: 116460,
    mass: "5.683 × 10^26 kg",
    temperature: "-178 °C",
    description:
      "Saturn is the sixth planet from the Sun and the second-largest in the Solar System, after Jupiter. It is a gas giant with an average radius of about nine times that of Earth. It only has one-eighth the average density of Earth; however, with its larger volume, Saturn is over 95 times more massive.",
    color: "#F0E68C",
    orbitalPeriod: 10759,
    distanceFromSun: 1434,
    moons: ["Titan", "Rhea", "Iapetus", "Dione", "...and 80+ more"],
  },
  uranus: {
    name: "Uranus",
    type: "Ice Giant",
    diameter: 50724,
    mass: "8.681 × 10^25 kg",
    temperature: "-224 °C",
    description:
      "Uranus is the seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System. Uranus is similar in composition to Neptune, and both have bulk chemical compositions which differ from that of the larger gas giants Jupiter and Saturn.",
    color: "#ADD8E6",
    orbitalPeriod: 30687,
    distanceFromSun: 2871,
    moons: [
      "Titania",
      "Oberon",
      "Umbriel",
      "Ariel",
      "Miranda",
      "...and 20+ more",
    ],
  },
  neptune: {
    name: "Neptune",
    type: "Ice Giant",
    diameter: 49244,
    mass: "1.024 × 10^26 kg",
    temperature: "-214 °C",
    description:
      "Neptune is the eighth and farthest-known Solar planet from the Sun. In the Solar System, it is the fourth-largest planet by diameter, the third-most-massive planet, and the densest giant planet. It is 17 times the mass of Earth, and slightly more massive than its near-twin Uranus.",
    color: "#4169E1",
    orbitalPeriod: 60190,
    distanceFromSun: 4495,
    moons: ["Triton", "...and 13 more"],
  },
};

const planetOrder = [
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

// --- Components ---

const OrbitingObject = ({ planet, animationSpeed, scale, isPaused }) => {
  const orbitDuration = ((365 / planet.orbitalPeriod) * 20) / animationSpeed;
  const planetSize = Math.max(4, Math.log2(planet.diameter) * scale * 0.5);
  const orbitSize = Math.log(planet.distanceFromSun + 1) * 60 * scale;

  const animationName = `orbit-${planet.name}`;
  const animationStyle = {
    animationName,
    animationDuration: `${orbitDuration}s`,
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
    animationPlayState: isPaused ? "paused" : "running",
  };

  const keyframes = `
        @keyframes ${animationName} {
            from {
                transform: rotate(0deg) translateX(${orbitSize}px) rotate(0deg);
            }
            to {
                transform: rotate(360deg) translateX(${orbitSize}px) rotate(-360deg);
            }
        }
    `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        className="absolute border border-dashed border-gray-600 rounded-full"
        style={{
          width: `${orbitSize * 2}px`,
          height: `${orbitSize * 2}px`,
          top: `calc(50% - ${orbitSize}px)`,
          left: `calc(50% - ${orbitSize}px)`,
        }}
      />
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          ...animationStyle,
          top: `calc(50% - ${planetSize / 2}px)`,
          left: `calc(50% - ${planetSize / 2}px)`,
        }}
      >
        <div
          className="rounded-full shadow-lg"
          style={{
            width: `${planetSize}px`,
            height: `${planetSize}px`,
            backgroundColor: planet.color,
          }}
        />
      </div>
    </>
  );
};

const InfoPanel = ({ object, onClose }) => {
  if (!object) return null;

  const Icon =
    object.type === "Star" ? Sun : object.type.includes("Giant") ? Globe : Moon;

  return (
    <div
      className="absolute top-0 left-0 h-full w-full md:w-1/3 lg:w-1/4 bg-gray-900 bg-opacity-80 backdrop-blur-sm text-white p-6 z-20 transform transition-transform duration-300 ease-in-out"
      style={{ transform: "translateX(0%)" }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white"
      >
        <ChevronsLeft size={24} />
      </button>
      <div className="flex items-center mb-6">
        <div
          className="w-16 h-16 rounded-full mr-4 flex items-center justify-center"
          style={{ backgroundColor: object.color }}
        >
          <Icon size={32} className="text-black opacity-70" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{object.name}</h2>
          <p className="text-lg text-gray-300">{object.type}</p>
        </div>
      </div>
      <div className="space-y-4 text-sm">
        <p>{object.description}</p>
        <div>
          <strong>Diameter:</strong> {object.diameter.toLocaleString()} km
        </div>
        <div>
          <strong>Mass:</strong> {object.mass}
        </div>
        <div>
          <strong>Surface Temp:</strong> {object.temperature}
        </div>
        <div>
          <strong>Distance from Sun:</strong>{" "}
          {object.distanceFromSun.toLocaleString()} million km
        </div>
        <div>
          <strong>Orbital Period:</strong>{" "}
          {object.orbitalPeriod.toLocaleString()} Earth days
        </div>
        {object.moons.length > 0 && (
          <div>
            <strong>Moons:</strong> {object.moons.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [selectedObject, setSelectedObject] = useState(celestialObjects.sun);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setScale(Math.min(1, width / 1200));
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectObject = (objectId) => {
    setSelectedObject(celestialObjects[objectId]);
    setIsInfoPanelOpen(true);
  };

  const handleNext = () => {
    if (selectedObject.name === "Sun") {
      handleSelectObject("mercury");
      return;
    }
    const currentIndex = planetOrder.indexOf(selectedObject.name.toLowerCase());
    const nextIndex = (currentIndex + 1) % planetOrder.length;
    handleSelectObject(planetOrder[nextIndex]);
  };

  const handlePrev = () => {
    if (selectedObject.name === "Sun") {
      handleSelectObject("neptune");
      return;
    }
    const currentIndex = planetOrder.indexOf(selectedObject.name.toLowerCase());
    const prevIndex =
      (currentIndex - 1 + planetOrder.length) % planetOrder.length;
    handleSelectObject(planetOrder[prevIndex]);
  };

  return (
    <div className="bg-gray-900 text-white font-sans w-full h-screen overflow-hidden flex flex-col relative">
      <style>
        {`
                    body { margin: 0; }
                    .bg-gray-900 {
                        background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
                    }
                `}
      </style>

      {isInfoPanelOpen && (
        <InfoPanel
          object={selectedObject}
          onClose={() => setIsInfoPanelOpen(false)}
        />
      )}

      {!isInfoPanelOpen && (
        <button
          onClick={() => setIsInfoPanelOpen(true)}
          className="absolute top-4 left-4 z-20 p-2 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-75"
        >
          <ChevronsRight size={24} />
        </button>
      )}

      <div
        ref={containerRef}
        className="flex-grow w-full h-full relative flex items-center justify-center"
      >
        {/* Sun */}
        <div
          className="absolute rounded-full cursor-pointer z-10 flex items-center justify-center shadow-2xl"
          style={{
            width: `${Math.log2(celestialObjects.sun.diameter) * scale * 2}px`,
            height: `${Math.log2(celestialObjects.sun.diameter) * scale * 2}px`,
            backgroundColor: celestialObjects.sun.color,
            boxShadow: `0 0 60px 15px ${celestialObjects.sun.color}`,
          }}
          onClick={() => handleSelectObject("sun")}
        >
          <span className="text-black font-bold opacity-60">Sun</span>
        </div>

        {/* Planets */}
        {planetOrder.map((planetId) => {
          const planet = celestialObjects[planetId];
          return (
            <div key={planet.name} onClick={() => handleSelectObject(planetId)}>
              <OrbitingObject
                planet={planet}
                animationSpeed={animationSpeed}
                scale={scale}
                isPaused={isPaused}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 w-full bg-gray-900 bg-opacity-50 p-4 z-20 flex items-center justify-center space-x-4 md:space-x-8">
        <button
          onClick={handlePrev}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          <ChevronsLeft size={24} />
        </button>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors shadow-lg"
        >
          {isPaused ? (
            <Play size={28} className="text-white" />
          ) : (
            <Pause size={28} className="text-white" />
          )}
        </button>
        <button
          onClick={handleNext}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          <ChevronsRight size={24} />
        </button>

        <div className="flex items-center space-x-2">
          <label htmlFor="speed" className="text-sm">
            Speed:
          </label>
          <input
            type="range"
            id="speed"
            min="0.1"
            max="10"
            step="0.1"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="w-24 md:w-40"
          />
        </div>
      </div>
    </div>
  );
}

/*SolarSystemExplorer.jsx, is a self-contained, 2D animated model of the solar system. It uses CSS animations and a simplified, logarithmic scale to show planetary orbits.

How it should be implemented: This component is not the main Atlas3DTrackerEnhanced.tsx. It is a separate, supplementary educational tool. Its purpose is to provide a basic, highly-performant overview of the solar system that can run on any device, including those that may struggle with the WebGL-based 3D tracker.

Strategic Role: You can implement this on a dedicated "/learn/solar-system" page or use it as part of the "Gamified Learning Journey" outlined in your CONTENT_STRATEGY_DOMINANCE.md. It is a valuable asset, but it is not on the critical path for the main 3I/ATLAS launch experience. */
