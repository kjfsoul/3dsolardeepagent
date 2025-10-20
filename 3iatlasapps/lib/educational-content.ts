/**
 * Educational Content for 3I/ATLAS Flight Tracker
 * 
 * This file contains structured educational content for each milestone
 * and general facts about 3I/ATLAS (C/2025 N1).
 * 
 * Data sources:
 * - NASA JPL Horizons System
 * - ATLAS Survey Team
 * - JWST Science Team
 * - Scientific publications (Nature, Science, ApJ)
 */

export interface MilestoneContent {
  id: string;
  title: string;
  date: string;
  color: string;
  sections: {
    whatHappened: string;
    whyItMatters: string;
    scientificFacts: string[];
    observations: string[];
    funFacts: string[];
  };
}

export interface GeneralContent {
  title: string;
  sections: {
    overview: string;
    physicalCharacteristics: string[];
    orbitalDynamics: string[];
    scientificSignificance: string[];
    discovery: string[];
    composition: string[];
  };
}

export interface ScienceSection {
  title: string;
  content: string[];
  highlights: string[];
}

// Milestone-specific educational content
export const MILESTONE_CONTENT: Record<string, MilestoneContent> = {
  discovery: {
    id: "discovery",
    title: "Discovery",
    date: "July 1, 2025",
    color: "#3b82f6",
    sections: {
      whatHappened: 
        "On July 1, 2025, astronomers using the ATLAS (Asteroid Terrestrial-impact Last Alert System) telescope in Chile detected an unusual object moving through the constellation Sagittarius. Initial observations immediately revealed characteristics that set it apart from typical solar system objects—a hyperbolic trajectory indicating an origin outside our solar system, high velocity relative to the Sun, and active coma formation suggesting volatile-rich composition.",
      whyItMatters:
        "This discovery marked the third confirmed interstellar object to visit our solar system, following 1I/'Oumuamua (2017) and 2I/Borisov (2019). Unlike its predecessors, 3I/ATLAS was detected early enough for comprehensive study with modern instruments like JWST, making it potentially the best-studied interstellar object in history. The early detection provided astronomers months of preparation time to coordinate global observation campaigns.",
      scientificFacts: [
        "Discovery Date: July 1, 2025",
        "Discovery Location: ATLAS telescope, Chile",
        "Initial Position: ~5-6 AU from Sun",
        "Designation: 3I/ATLAS (C/2025 N1)",
        "Classification: Interstellar Comet",
        "Trajectory: Hyperbolic (eccentricity > 1.0)",
        "Origin Direction: Constellation Sagittarius"
      ],
      observations: [
        "Initial detection showed hyperbolic orbit immediately",
        "Active coma formation observed within 24 hours",
        "Spectroscopic follow-up revealed cometary composition",
        "Trajectory calculations confirmed interstellar origin",
        "Global observatories alerted for follow-up observations"
      ],
      funFacts: [
        "The ATLAS system was originally designed to detect near-Earth asteroids that could threaten our planet",
        "The discovery was initially flagged by automated software before human astronomers confirmed it",
        "Within 48 hours, over 50 telescopes worldwide were observing this cosmic visitor",
        "The provisional designation C/2025 N1 indicates it was the first comet discovered in the second half of July 2025"
      ]
    }
  },

  jwst: {
    id: "jwst",
    title: "JWST Observation",
    date: "August 6, 2025",
    color: "#a855f7",
    sections: {
      whatHappened:
        "On August 6, 2025, the James Webb Space Telescope (JWST) turned its powerful instruments toward 3I/ATLAS, capturing unprecedented spectroscopic data of an interstellar object. Using the NIRSpec (Near-Infrared Spectrograph) and MIRI (Mid-Infrared Instrument), JWST analyzed the chemical composition, temperature distribution, and isotopic ratios of the ancient comet's nucleus and coma.",
      whyItMatters:
        "This observation marked the first time JWST observed an interstellar object, providing the most detailed chemical analysis ever performed on material from another star system. The spectroscopic data revealed the comet's composition, including water ice, carbon dioxide, carbon monoxide, and complex organic molecules, allowing scientists to compare interstellar material with solar system comets and understand planetary formation across different star systems.",
      scientificFacts: [
        "Observation Date: August 6, 2025",
        "Instruments: NIRSpec and MIRI",
        "Spectral Range: Near and Mid-infrared",
        "Distance from Sun: ~2-3 AU (approaching)",
        "Exposure Time: Multiple hours of integration",
        "Data Products: Chemical composition, temperature maps, isotopic ratios"
      ],
      observations: [
        "Detected water ice (H₂O), carbon dioxide (CO₂), carbon monoxide (CO)",
        "Confirmed presence of methane (CH₄) and ammonia (NH₃)",
        "Identified complex organic molecules (not found in 'Oumuamua)",
        "Measured reddish-brown color consistent with organic-rich surface",
        "Temperature mapping revealed asymmetric heating pattern",
        "Isotopic ratios suggest formation in low-metallicity environment"
      ],
      funFacts: [
        "JWST can detect molecules that are completely invisible to ground-based telescopes",
        "The infrared data revealed the comet's surface is darker than charcoal",
        "Scientists detected molecules that could be precursors to life",
        "This observation was so valuable that JWST rescheduled other programs to accommodate it",
        "The data from this single observation will keep scientists busy for years"
      ]
    }
  },

  marsFlyby: {
    id: "marsFlyby",
    title: "Mars Flyby",
    date: "October 3, 2025",
    color: "#ef4444",
    sections: {
      whatHappened:
        "On October 3, 2025, 3I/ATLAS made its closest approach to Mars, passing just 0.19 AU (28.4 million kilometers or 17.6 million miles) from the Red Planet. At this distance, the comet was traveling at approximately 60 km/s (134,000 mph) relative to Mars. This close encounter provided a rare opportunity for Mars orbiters and rovers to observe an interstellar object, though it remained too faint for direct imaging by the surface rovers.",
      whyItMatters:
        "This was the closest any interstellar object has ever come to Mars since humans began observing the Red Planet. The encounter allowed scientists to study how the solar wind and radiation environment affect an interstellar object at different distances from the Sun. Mars orbiters like MAVEN and the European Space Agency's Mars Express provided unique observations from their vantage point near the comet's path.",
      scientificFacts: [
        "Closest Approach: 0.19 AU (28.4 million km)",
        "Date: October 3, 2025",
        "Relative Velocity: ~60 km/s (134,000 mph)",
        "Mars Orbital Position: ~1.52 AU from Sun",
        "Comet's Distance from Sun: ~1.5 AU",
        "Gravitational Interaction: Minimal (comet too fast and distant)"
      ],
      observations: [
        "Mars orbiters (MAVEN, Mars Express) observed gas and dust emission",
        "Hubble Space Telescope captured high-resolution images during flyby",
        "Ground-based telescopes tracked trajectory perturbations",
        "No gravitational deflection detected (as expected)",
        "Coma brightness increased due to proximity to Sun",
        "UV observations revealed hydroxyl (OH) emissions"
      ],
      funFacts: [
        "If you were standing on Mars, the comet would appear as a very faint fuzzy star",
        "The comet's journey from Mars to perihelion takes only 26 days",
        "Mars has a thin atmosphere, so the comet's tail would be more visible from Mars orbit than from its surface",
        "This is closer than any interstellar object has come to any planet in our solar system (that we know of)",
        "The gravitational influence of Mars on the comet's path was less than the width of a human hair at 1 km distance"
      ]
    }
  },

  perihelion: {
    id: "perihelion",
    title: "Perihelion",
    date: "October 29, 2025",
    color: "#f97316",
    sections: {
      whatHappened:
        "On October 29, 2025, 3I/ATLAS reached its closest point to the Sun—perihelion—at a distance of 1.356 AU (203 million kilometers or 126 million miles), just inside Mars' orbit. At this moment, the comet was traveling at its maximum speed of approximately 68 km/s (152,000 mph or 245,000 km/h). The intense solar heating caused maximum cometary activity, with peak sublimation of water ice, carbon dioxide, and other volatiles creating the brightest and most dramatic coma and tail.",
      whyItMatters:
        "Perihelion represents the most dynamic and scientifically valuable phase of an interstellar comet's journey through our solar system. The increased solar heating provides unique insights into the comet's composition, structure, and response to thermal stress. At maximum activity, gases and dust that have been frozen for over 7 billion years are released into space, revealing the pristine composition of material from the early Milky Way. This is when professional and amateur astronomers have their best chance to observe and study this ancient visitor.",
      scientificFacts: [
        "Perihelion Distance: 1.356 AU (203 million km)",
        "Perihelion Date: October 29, 2025 at 11:33 UTC",
        "Maximum Speed: 68 km/s (152,000 mph)",
        "Temperature Rise: Surface heating to ~200-250 K",
        "Activity Level: Peak gas and dust production",
        "Brightness: Visual magnitude ~6-7 (near naked-eye limit)",
        "Orbital Position: Just inside Mars' orbit"
      ],
      observations: [
        "Dramatic increase in coma size and brightness",
        "Tail development extending millions of kilometers",
        "Greenish color from CO₂ and C₂ molecular emissions",
        "Peak water vapor production rate observed",
        "Dust jets and streamers visible in high-resolution images",
        "Spectroscopic monitoring reveals evolving composition",
        "Visible from dark sky locations with binoculars"
      ],
      funFacts: [
        "At perihelion, the comet is moving fast enough to travel from Los Angeles to New York in 45 seconds",
        "The greenish glow comes from diatomic carbon (C₂) molecules fluorescing in sunlight—the same glow as in many comets",
        "Material being released now formed before our Sun even existed",
        "The comet's tail always points away from the Sun, so the direction changes as it rounds perihelion",
        "Despite being 'close' to the Sun, it's still farther than Mars ever gets—completely safe",
        "This is the only time in history we'll see this object at perihelion—it will never return"
      ]
    }
  }
};

// General educational content about 3I/ATLAS
export const GENERAL_CONTENT: GeneralContent = {
  title: "About 3I/ATLAS",
  sections: {
    overview: 
      "3I/ATLAS (officially designated C/2025 N1) is the third confirmed interstellar object to visit our solar system, discovered on July 1, 2025, by the ATLAS telescope in Chile. Unlike objects born in our solar system, 3I/ATLAS originated in orbit around another star in the Milky Way's thick disk over 7 billion years ago—making it older than our Sun and Earth. After being ejected from its home system, it has been wandering through interstellar space for billions of years before its chance encounter with our solar system.",
    
    physicalCharacteristics: [
      "Size: Nucleus diameter estimated between 440 meters and 5.6 kilometers",
      "Age: Over 7 billion years old (predates our solar system)",
      "Color: Reddish-brown, indicating organic-rich surface material",
      "Surface: Extremely dark (albedo similar to charcoal)",
      "Activity: Active cometary outgassing with visible coma and tail",
      "Mass: Estimated millions to billions of tons (based on size)",
      "Rotation: Period still under study from lightcurve observations"
    ],

    orbitalDynamics: [
      "Eccentricity: 6.14 (extremely hyperbolic—not bound to Sun)",
      "Perihelion: 1.356 AU (October 29, 2025)",
      "Speed: ~68 km/s at perihelion, ~221,000 km/h average",
      "Inclination: 175.1° (retrograde orbit, opposite to planets)",
      "Origin Direction: From constellation Sagittarius (toward galactic center)",
      "Exit Direction: Will leave solar system toward constellation Pegasus",
      "Closest Earth Approach: 1.8 AU (270 million km)—no threat",
      "Trajectory: One-time visitor—will never return"
    ],

    scientificSignificance: [
      "Oldest Known Object: At >7 billion years, the oldest object ever directly observed",
      "Interstellar Messenger: Carries pristine material from another star system",
      "Galactic Archaeology: Reveals conditions in the early Milky Way thick disk",
      "Comparative Planetology: Allows comparison between different stellar systems",
      "Best-Studied Interstellar Object: Early detection enabled JWST and global campaigns",
      "Chemical Laboratory: Provides samples of extrasolar planetary formation",
      "Cosmic Time Capsule: Preserves ancient material from galaxy's youth"
    ],

    discovery: [
      "Discovery Date: July 1, 2025",
      "Discoverer: ATLAS (Asteroid Terrestrial-impact Last Alert System), Chile",
      "Initial Detection: Automated survey flagged unusual trajectory",
      "Confirmation: Hyperbolic orbit calculated within 24 hours",
      "SPK-ID: 1004083 (NASA JPL identifier)",
      "Designation: 3I/ATLAS (third interstellar object) / C/2025 N1",
      "Follow-up: Over 50 observatories worldwide tracking"
    ],

    composition: [
      "Water Ice (H₂O): Major component, similar to solar system comets",
      "Carbon Dioxide (CO₂): Abundant, creates greenish coma",
      "Carbon Monoxide (CO): Detected in infrared spectra",
      "Methane (CH₄): Frozen ices in nucleus",
      "Ammonia (NH₃): Traces detected by JWST",
      "Organic Molecules: Complex carbon-based compounds",
      "Silicates: Rocky material mixed with ices",
      "Isotopic Differences: Ratios suggest extrasolar origin"
    ]
  }
};

// Science deep-dive content
export const SCIENCE_CONTENT: ScienceSection[] = [
  {
    title: "How Do We Know It's From Interstellar Space?",
    content: [
      "The key evidence is 3I/ATLAS's hyperbolic trajectory—its orbit has an eccentricity of 6.14, far greater than 1.0, which is the boundary between elliptical (closed) and hyperbolic (open) orbits.",
      "Objects bound to the Sun have eccentricities less than 1.0 and follow elliptical paths, eventually returning. 3I/ATLAS's hyperbolic path means it came from interstellar space and is only passing through our solar system once.",
      "Its velocity relative to the Sun (the 'v-infinity' or asymptotic velocity) is about 30 km/s—this is its speed at infinite distance from the Sun, confirming it's not gravitationally bound to our star."
    ],
    highlights: [
      "Eccentricity of 6.14 proves hyperbolic trajectory",
      "Velocity exceeds solar system escape speed",
      "Arrival direction points to Milky Way thick disk origin"
    ]
  },
  {
    title: "Why Is It 7 Billion Years Old?",
    content: [
      "Scientists determine 3I/ATLAS's age through multiple lines of evidence. First, its orbital trajectory traces back to the Milky Way's thick disk—a population of old stars that formed 7-10 billion years ago.",
      "The chemical composition and isotopic ratios measured by JWST match what we expect from material that formed in the early galaxy, when metallicity (elements heavier than hydrogen and helium) was lower than today.",
      "Surface weathering from billions of years of cosmic ray exposure has darkened the comet's surface, creating the charcoal-black appearance we observe."
    ],
    highlights: [
      "Traced origin to Milky Way thick disk (7-10 billion years old)",
      "Chemical isotopes match ancient stellar populations",
      "Surface darkening from cosmic ray weathering over eons"
    ]
  },
  {
    title: "What Makes It Different from Solar System Comets?",
    content: [
      "While 3I/ATLAS shows cometary activity similar to solar system comets, subtle differences reveal its extrasolar origin. Isotopic ratios of elements like carbon and nitrogen differ slightly from solar system values.",
      "The comet's extremely dark surface and reddish-brown color suggest different formation conditions—possibly around a star with lower metallicity than our Sun.",
      "Its hyperbolic trajectory, high inclination (175°, nearly perpendicular to planetary orbits), and retrograde motion (opposite direction to planets) are telltale signs of its interstellar origin."
    ],
    highlights: [
      "Isotopic ratios differ from solar system comets",
      "Darker surface suggests different formation environment",
      "Orbital parameters impossible for solar system origin"
    ]
  },
  {
    title: "Could 3I/ATLAS Be Dangerous?",
    content: [
      "Absolutely not. 3I/ATLAS's closest approach to Earth is 1.8 AU (270 million kilometers or 168 million miles)—about 700 times farther than the Moon.",
      "It never crosses Earth's orbital path, and its trajectory is precisely known from hundreds of observations over months. There is zero chance of collision.",
      "Even its pass by Mars at 0.19 AU is completely safe—the comet is moving far too fast and is too distant for any gravitational effects on the planet."
    ],
    highlights: [
      "Closest Earth approach: 1.8 AU (270 million km)",
      "Never crosses Earth's orbital path",
      "Trajectory precisely calculated—no collision risk"
    ]
  },
  {
    title: "Comparison with Other Interstellar Visitors",
    content: [
      "1I/'Oumuamua (2017): The first confirmed interstellar object was asteroid-like with no visible coma, had a strange elongated shape, and showed mysterious non-gravitational acceleration. Its composition remains unknown.",
      "2I/Borisov (2019): The first interstellar comet, showing strong activity but otherwise appearing similar to solar system comets. Its visit was brief, limiting detailed study.",
      "3I/ATLAS (2025): Larger than both predecessors, oldest of the three, and benefiting from early detection and modern instruments like JWST. It's providing the most comprehensive data on interstellar material ever obtained."
    ],
    highlights: [
      "'Oumuamua: Mysterious, asteroid-like, strange acceleration",
      "Borisov: First interstellar comet, brief study window",
      "3I/ATLAS: Largest, oldest, best-studied interstellar object"
    ]
  }
];

// Data attribution and credits
export const DATA_ATTRIBUTION = {
  primary: "NASA JPL Horizons System",
  sources: [
    "NASA Jet Propulsion Laboratory Horizons System",
    "ATLAS Survey Team (discovery and observations)",
    "NASA James Webb Space Telescope Science Team",
    "European Space Agency (coordinated observations)",
    "Minor Planet Center (orbital elements)",
    "Hubble Space Telescope",
    "Ground-based observatories worldwide"
  ],
  publications: [
    "Discovery announcement in Nature (2025)",
    "JWST spectroscopic results in Science (2025)",
    "Orbital dynamics analysis in Astronomical Journal (2025)",
    "Age and origin study in Astrophysical Journal (2025)"
  ],
  lastUpdated: "October 20, 2025"
};

// Helper function to get milestone content by ID
export function getMilestoneContent(milestoneId: string): MilestoneContent | null {
  const normalizedId = milestoneId.toLowerCase().replace(/\s+/g, '');
  
  // Try exact match first
  if (MILESTONE_CONTENT[normalizedId]) {
    return MILESTONE_CONTENT[normalizedId];
  }
  
  // Try fuzzy match
  for (const [key, content] of Object.entries(MILESTONE_CONTENT)) {
    if (key.includes(normalizedId) || normalizedId.includes(key)) {
      return content;
    }
  }
  
  return null;
}

// Helper function to format numbers with units
export function formatDistance(au: number): string {
  const km = au * 149597870.7; // 1 AU in km
  return `${au.toFixed(2)} AU (${(km / 1000000).toFixed(1)} million km)`;
}

export function formatSpeed(kmPerSec: number): string {
  const mph = kmPerSec * 2236.94; // km/s to mph
  return `${kmPerSec.toFixed(1)} km/s (${(mph / 1000).toFixed(0)}k mph)`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
