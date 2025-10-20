# First, let me create a comprehensive prompt and execution system to gather all content 
# and generate questions/answers in code-friendly formats

import json
import re
from typing import Dict, List, Any, Optional

class ContentProcessor:
    """Process narrative content and generate code-friendly formats"""
    
    def __init__(self):
        self.scientific_facts = []
        self.narrative_elements = []
        self.question_templates = []
        self.trait_mappings = {
            "pragmatist": "focused on evidence and practical solutions",
            "mystic": "open to extraordinary possibilities and cosmic mystery", 
            "idealist": "believes in positive outcomes and higher purpose",
            "cynic": "skeptical and focused on worst-case scenarios",
            "risk_taker": "willing to act on incomplete information",
            "cautious": "prefers safe, well-tested approaches",
            "leader": "takes charge and makes decisive choices",
            "analyst": "prefers to gather data before acting"
        }
    
    def extract_scientific_facts(self, knowledge_base_content: str) -> List[Dict]:
        """Extract verifiable scientific facts for skill checks"""
        facts = []
        
        # 3I/ATLAS core facts
        facts.extend([
            {
                "category": "discovery",
                "question": "3I/ATLAS was discovered on which date and by which telescope system?",
                "correct": "July 1, 2025 by ATLAS telescope in Chile",
                "distractors": [
                    "June 15, 2025 by Hubble Space Telescope",
                    "August 10, 2025 by James Webb Space Telescope"
                ],
                "explanation": "3I/ATLAS was discovered July 1, 2025 by the ATLAS (Asteroid Terrestrial-impact Last Alert System) telescope in Chile."
            },
            {
                "category": "trajectory",
                "question": "3I/ATLAS follows which type of orbital path, confirming its interstellar origin?",
                "correct": "Hyperbolic orbit with eccentricity >1.0",
                "distractors": [
                    "Elliptical orbit bound to our solar system",
                    "Parabolic escape trajectory"
                ],
                "explanation": "Hyperbolic orbits have eccentricity >1, indicating the object has escape velocity and will not return."
            },
            {
                "category": "physical_properties", 
                "question": "Current estimates place 3I/ATLAS's nucleus diameter in which range?",
                "correct": "440 meters to 5.6 kilometers",
                "distractors": [
                    "10-50 kilometers",
                    "100-200 meters"
                ],
                "explanation": "Observational constraints limit the nucleus diameter to between 440 meters and 5.6 kilometers."
            },
            {
                "category": "speed",
                "question": "3I/ATLAS travels at approximately what velocity relative to the Sun?",
                "correct": "137,000 mph (221,000 km/h)",
                "distractors": [
                    "67,000 mph - similar to Earth's orbital velocity",
                    "25,000 mph - typical asteroid velocity"
                ],
                "explanation": "3I/ATLAS travels at ~137,000 mph, well above solar system escape velocity."
            },
            {
                "category": "age_origin",
                "question": "3I/ATLAS is estimated to be approximately how old?",
                "correct": "Over 7 billion years - older than our solar system",
                "distractors": [
                    "4.6 billion years - same age as our solar system",
                    "2 billion years - formed after solar system"
                ],
                "explanation": "3I/ATLAS originated in the Milky Way thick disk and predates our solar system."
            },
            {
                "category": "composition",
                "question": "Initial JWST spectroscopic analysis of 3I/ATLAS confirmed which volatile compounds?",
                "correct": "Water ice (H₂O), Carbon monoxide (CO), Methane (CH₄)",
                "distractors": [
                    "Only carbon dioxide and nitrogen",
                    "Exotic silicon-based polymers"
                ],
                "explanation": "Standard volatile compounds were detected, consistent with cometary composition."
            }
        ])
        
        # Comparative interstellar object facts
        facts.extend([
            {
                "category": "comparison",
                "question": "1I/'Oumuamua was notable for which unusual characteristic?",
                "correct": "Highly elongated shape - possibly 10:1 length to width ratio",
                "distractors": [
                    "Spherical like most asteroids",
                    "Perfectly cubic artificial geometry"
                ],
                "explanation": "'Oumuamua exhibited extreme elongation, making it the most elongated object observed in our solar system."
            },
            {
                "category": "comparison",
                "question": "2I/Borisov was distinguished by which unusual chemical signature?",
                "correct": "Extremely high CO concentration - 9 to 26 times higher than typical comets",
                "distractors": [
                    "Normal carbon monoxide levels similar to solar system comets",
                    "No carbon monoxide detected"
                ],
                "explanation": "2I/Borisov showed extraordinarily high CO concentrations, indicating formation in extremely cold environments."
            }
        ])
        
        # Orbital mechanics fundamentals
        facts.extend([
            {
                "category": "orbital_mechanics",
                "question": "A hyperbolic orbit is characterized by:",
                "correct": "Eccentricity greater than 1 - object has escape velocity",
                "distractors": [
                    "Eccentricity less than 1 - object remains bound",
                    "Eccentricity exactly equal to 1 - parabolic trajectory"
                ],
                "explanation": "Hyperbolic orbits (e>1) indicate sufficient velocity to permanently escape gravitational influence."
            },
            {
                "category": "galactic_structure",
                "question": "The Milky Way thick disk contains:",
                "correct": "Old stars, 7-10+ billion years, from galaxy's early formation",
                "distractors": [
                    "Young, recently formed stars with high metallicity",
                    "Dense cluster of black holes near galactic center"
                ],
                "explanation": "The thick disk contains ancient stellar populations from our galaxy's early assembly period."
            }
        ])
        
        return facts
    
    def generate_situational_dilemmas(self) -> List[Dict]:
        """Generate situational dilemmas for psychographic profiling"""
        dilemmas = []
        
        dilemmas.extend([
            {
                "category": "resource_allocation",
                "scenario": "Multiple critical observations compete for limited telescope time during 3I/ATLAS's optimal viewing window.",
                "question": "You must prioritize ONE observation type:",
                "choices": [
                    {
                        "text": "Spectroscopic analysis - determine exact chemical composition",
                        "traits": ["analyst", "pragmatist"],
                        "reasoning": "Systematic scientific approach"
                    },
                    {
                        "text": "High-resolution imaging - map surface features and structure", 
                        "traits": ["cautious", "pragmatist"],
                        "reasoning": "Visual confirmation reduces uncertainty"
                    },
                    {
                        "text": "Radio monitoring - listen for artificial signals",
                        "traits": ["mystic", "risk_taker"],
                        "reasoning": "Open to extraordinary possibilities"
                    },
                    {
                        "text": "Gravitational measurement - precise trajectory determination",
                        "traits": ["analyst", "cautious"], 
                        "reasoning": "Fundamental physics data priority"
                    }
                ]
            },
            {
                "category": "risk_management",
                "scenario": "A Class X solar flare erupts during optimal 3I/ATLAS observation window. Charged particles threaten space telescopes but could reveal magnetic field interactions.",
                "question": "Your directive:",
                "choices": [
                    {
                        "text": "Protect instruments - safeguard billions in telescope infrastructure",
                        "traits": ["cautious", "pragmatist"],
                        "reasoning": "Risk mitigation and resource protection"
                    },
                    {
                        "text": "Risk observation - capture unprecedented magnetosphere data",
                        "traits": ["risk_taker", "idealist"],
                        "reasoning": "Scientific opportunity outweighs risk"
                    },
                    {
                        "text": "Partial exposure - balance risk with opportunity",
                        "traits": ["analyst", "leader"],
                        "reasoning": "Calculated compromise approach"
                    }
                ]
            },
            {
                "category": "information_sharing",
                "scenario": "Initial analysis reveals potentially paradigm-shifting discoveries. Global scientific community demands data sharing, but security advisors counsel caution.",
                "question": "Your recommendation:",
                "choices": [
                    {
                        "text": "Full open science - immediate publication benefits humanity",
                        "traits": ["idealist", "leader"],
                        "reasoning": "Believes in transparent scientific collaboration"
                    },
                    {
                        "text": "Peer review first - validate findings before release",
                        "traits": ["cautious", "analyst"],
                        "reasoning": "Scientific rigor and verification priority"
                    },
                    {
                        "text": "Security review - protect potentially sensitive information",
                        "traits": ["cynic", "pragmatist"],
                        "reasoning": "Skeptical of premature disclosure risks"
                    },
                    {
                        "text": "Selective sharing - trusted international partners only",
                        "traits": ["pragmatist", "leader"],
                        "reasoning": "Balanced approach to collaboration"
                    }
                ]
            },
            {
                "category": "intervention_ethics",
                "scenario": "Engineering proposes an intercept mission to 3I/ATLAS using existing spacecraft. Success probability: 15%. Failure could contaminate or damage the object.",
                "question": "Mission authorization decision:",
                "choices": [
                    {
                        "text": "Approve mission - historic opportunity for direct contact",
                        "traits": ["risk_taker", "idealist"],
                        "reasoning": "Willing to accept high risk for breakthrough potential"
                    },
                    {
                        "text": "Deny mission - preserve object's pristine state",
                        "traits": ["cautious", "analyst"],
                        "reasoning": "Scientific preservation over intervention"
                    },
                    {
                        "text": "Conditional approval - only if success probability improves",
                        "traits": ["pragmatist", "leader"],
                        "reasoning": "Evidence-based decision making"
                    }
                ]
            }
        ])
        
        return dilemmas
    
    def generate_philosophical_probes(self) -> List[Dict]:
        """Generate worldview and philosophical assessment questions"""
        probes = []
        
        probes.extend([
            {
                "category": "cosmic_significance",
                "context": "The discovery of 3I/ATLAS - a 7-billion-year-old messenger from the galaxy's ancient past - fundamentally alters humanity's cosmic perspective.",
                "question": "Does this discovery make humanity's existence feel:",
                "choices": [
                    {
                        "text": "More significant - we are conscious witnesses to a vast cosmic story",
                        "traits": ["idealist", "mystic"],
                        "worldview": "Finds meaning in cosmic connection"
                    },
                    {
                        "text": "Less significant - we are brief sparks in an incomprehensibly old universe",
                        "traits": ["cynic", "pragmatist"],
                        "worldview": "Humbled by cosmic scale"
                    },
                    {
                        "text": "Equally significant - significance comes from our choices, not cosmic age",
                        "traits": ["leader", "analyst"],
                        "worldview": "Self-determined meaning creation"
                    }
                ]
            },
            {
                "category": "scientific_methodology",
                "context": "3I/ATLAS exhibits behaviors that challenge conventional models. When faced with anomalous data:",
                "question": "Your epistemic approach:",
                "choices": [
                    {
                        "text": "Trust the data - observations trump established theory",
                        "traits": ["risk_taker", "idealist"],
                        "worldview": "Empirical evidence primacy"
                    },
                    {
                        "text": "Question instruments - systematic error more likely than new physics",
                        "traits": ["cautious", "cynic"],
                        "worldview": "Skeptical verification approach"
                    },
                    {
                        "text": "Explore alternatives - consider unconventional explanations",
                        "traits": ["mystic", "analyst"],
                        "worldview": "Open to paradigm shifts"
                    },
                    {
                        "text": "Gather more data - insufficient information for conclusions",
                        "traits": ["analyst", "pragmatist"],
                        "worldview": "Methodical evidence accumulation"
                    }
                ]
            },
            {
                "category": "cosmic_responsibility",
                "context": "If 3I/ATLAS proves artificial, humanity must decide our relationship to this galactic heritage.",
                "question": "Our responsibility should be to:",
                "choices": [
                    {
                        "text": "Preserve it as universal heritage - cosmic museum piece",
                        "traits": ["idealist", "cautious"],
                        "worldview": "Stewardship of cosmic artifacts"
                    },
                    {
                        "text": "Study intensively - knowledge benefits justify risks",
                        "traits": ["pragmatist", "analyst"],
                        "worldview": "Scientific understanding priority"
                    },
                    {
                        "text": "Attempt communication - engage with builders if possible",
                        "traits": ["mystic", "risk_taker"],
                        "worldview": "Cosmic connection seeking"
                    },
                    {
                        "text": "Prepare defenses - assume threat until proven otherwise",
                        "traits": ["cynic", "leader"],
                        "worldview": "Cautious threat assessment"
                    }
                ]
            }
        ])
        
        return probes

# Initialize processor
processor = ContentProcessor()

print("Content processing system initialized.")
print("Generating comprehensive question database...")

# Generate all question types
scientific_facts = processor.extract_scientific_facts("")
situational_dilemmas = processor.generate_situational_dilemmas()
philosophical_probes = processor.generate_philosophical_probes()

print(f"Generated {len(scientific_facts)} scientific fact checks")
print(f"Generated {len(situational_dilemmas)} situational dilemmas") 
print(f"Generated {len(philosophical_probes)} philosophical probes")
print(f"Total questions: {len(scientific_facts) + len(situational_dilemmas) + len(philosophical_probes)}")