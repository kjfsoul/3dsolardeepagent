# Now let's create code-friendly formats for the narrative content
# Generate TypeScript interfaces, JSON structures, and implementation code

typescript_interfaces = '''
// TypeScript Interfaces for The ATLAS Directive

interface Choice {
  text: string;
  nextStage: string;
  traits: string[];
  reasoning?: string;
  worldview?: string;
}

interface Stage {
  id: string;
  question: string;
  choices: Choice[];
  isFatal?: boolean;
  category?: string;
  explanation?: string;
  outcome?: Outcome;
}

interface Outcome {
  title: string;
  narrative: string;
  trajectoryType: string;
  animationKey: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  artDirection: string;
}

interface UserProfile {
  traits: {
    [key: string]: number; // trait scores 0-100
  };
  choices: Choice[];
  path: string[];
  outcome?: Outcome;
}

interface NarrativeTree {
  [stageId: string]: Stage;
}

// Game State Management
interface GameState {
  currentStage: string;
  userProfile: UserProfile;
  completedStages: string[];
  chronoTokens: number;
  unlockedOutcomes: string[];
}
'''

# Generate the complete narrative tree as JSON
narrative_tree_json = {
    # Starting sequence
    "start": {
        "id": "start",
        "category": "introduction",
        "question": "You are Analyst designation ALT-7, newly assigned to The ATLAS Directive. The object designated 3I/ATLAS was discovered July 1, 2025, approaching our solar system. Initial trajectory analysis confirms:",
        "choices": [
            {
                "text": "Hyperbolic orbit - proving interstellar origin",
                "nextStage": "trajectory_confirmed",
                "traits": ["pragmatist", "analyst"],
                "reasoning": "Evidence-based conclusion from orbital mechanics"
            },
            {
                "text": "Elliptical orbit - indicating solar system origin",
                "nextStage": "fatal_trajectory_error", 
                "traits": ["cautious"],
                "reasoning": "Conservative interpretation lacking analysis"
            }
        ]
    },
    
    "fatal_trajectory_error": {
        "id": "fatal_trajectory_error",
        "isFatal": True,
        "category": "skill_check",
        "question": "DIRECTIVE FAILURE: An elliptical orbit would indicate 3I/ATLAS is bound to our solar system. This contradicts its interstellar classification. Your clearance is suspended.",
        "explanation": "3I/ATLAS follows a hyperbolic trajectory with eccentricity >1.0, confirming interstellar origin and escape velocity.",
        "choices": [
            {
                "text": "Access refresher materials and restart analysis",
                "nextStage": "start",
                "traits": [],
                "reasoning": "Learning from error"
            }
        ]
    },
    
    "trajectory_confirmed": {
        "id": "trajectory_confirmed", 
        "category": "skill_check",
        "question": "Correct. 3I/ATLAS follows a hyperbolic path with eccentricity >1.0. Preliminary size estimates place its nucleus diameter between:",
        "choices": [
            {
                "text": "440 meters to 5.6 kilometers",
                "nextStage": "size_confirmed",
                "traits": ["analyst"],
                "reasoning": "Accurate observational constraints"
            },
            {
                "text": "10-50 kilometers",
                "nextStage": "fatal_size_error",
                "traits": ["risk_taker"],
                "reasoning": "Overestimation without data support"
            }
        ]
    }
}

# Add all scientific facts as code-friendly structures
for fact in scientific_facts:
    stage_id = f"fact_check_{fact['category']}"
    fatal_id = f"fatal_{fact['category']}"
    correct_id = f"{fact['category']}_correct"
    
    # Create the skill check stage
    narrative_tree_json[stage_id] = {
        "id": stage_id,
        "category": "skill_check",
        "question": fact["question"],
        "choices": []
    }
    
    # Add correct answer
    narrative_tree_json[stage_id]["choices"].append({
        "text": fact["correct"],
        "nextStage": correct_id,
        "traits": ["analyst"],
        "reasoning": "Accurate scientific knowledge"
    })
    
    # Add distractors
    for distractor in fact["distractors"]:
        narrative_tree_json[stage_id]["choices"].append({
            "text": distractor,
            "nextStage": fatal_id,
            "traits": ["cautious"],
            "reasoning": "Incorrect or incomplete understanding"
        })
    
    # Create fatal blow stage
    narrative_tree_json[fatal_id] = {
        "id": fatal_id,
        "isFatal": True,
        "category": "skill_check",
        "question": f"DIRECTIVE FAILURE: {fact['explanation']}",
        "explanation": fact["explanation"],
        "choices": [
            {
                "text": "Review scientific data and restart",
                "nextStage": stage_id,
                "traits": [],
                "reasoning": "Learning from error"
            }
        ]
    }

# Add situational dilemmas
for i, dilemma in enumerate(situational_dilemmas):
    stage_id = f"dilemma_{dilemma['category']}"
    
    narrative_tree_json[stage_id] = {
        "id": stage_id,
        "category": "situational_dilemma",
        "question": f"{dilemma['scenario']} {dilemma['question']}",
        "choices": []
    }
    
    for choice in dilemma["choices"]:
        narrative_tree_json[stage_id]["choices"].append({
            "text": choice["text"],
            "nextStage": f"outcome_{dilemma['category']}_{len(narrative_tree_json[stage_id]['choices'])}",
            "traits": choice["traits"],
            "reasoning": choice["reasoning"]
        })

# Add philosophical probes
for i, probe in enumerate(philosophical_probes):
    stage_id = f"philosophy_{probe['category']}"
    
    narrative_tree_json[stage_id] = {
        "id": stage_id,
        "category": "philosophical_probe", 
        "question": f"{probe['context']} {probe['question']}",
        "choices": []
    }
    
    for choice in probe["choices"]:
        narrative_tree_json[stage_id]["choices"].append({
            "text": choice["text"],
            "nextStage": f"philosophy_outcome_{len(narrative_tree_json[stage_id]['choices'])}",
            "traits": choice["traits"],
            "reasoning": choice.get("reasoning", ""),
            "worldview": choice["worldview"]
        })

print("Generated TypeScript interfaces and JSON structures.")
print(f"Created {len(narrative_tree_json)} narrative stages.")

# Generate React component structure
react_component = '''
// React Component for The ATLAS Directive

import React, { useState, useEffect } from 'react';
import { Stage, Choice, GameState, UserProfile } from './types';

interface NarrativeEngineProps {
  narrativeTree: { [key: string]: Stage };
  onGameComplete: (profile: UserProfile) => void;
}

const NarrativeEngine: React.FC<NarrativeEngineProps> = ({ 
  narrativeTree, 
  onGameComplete 
}) => {
  const [gameState, setGameState] = useState<GameState>({
    currentStage: 'start',
    userProfile: {
      traits: {
        pragmatist: 0, mystic: 0, idealist: 0, cynic: 0,
        risk_taker: 0, cautious: 0, leader: 0, analyst: 0
      },
      choices: [],
      path: ['start']
    },
    completedStages: [],
    chronoTokens: 3,
    unlockedOutcomes: []
  });

  const currentStage = narrativeTree[gameState.currentStage];

  const makeChoice = (choice: Choice) => {
    // Update trait scores
    const updatedTraits = { ...gameState.userProfile.traits };
    choice.traits.forEach(trait => {
      updatedTraits[trait] = Math.min(100, updatedTraits[trait] + 10);
    });

    // Update game state
    setGameState(prev => ({
      ...prev,
      currentStage: choice.nextStage,
      userProfile: {
        ...prev.userProfile,
        traits: updatedTraits,
        choices: [...prev.userProfile.choices, choice],
        path: [...prev.userProfile.path, choice.nextStage]
      },
      completedStages: [...prev.completedStages, prev.currentStage]
    }));

    // Check for game completion
    if (narrativeTree[choice.nextStage]?.outcome) {
      onGameComplete({
        ...gameState.userProfile,
        traits: updatedTraits,
        choices: [...gameState.userProfile.choices, choice],
        outcome: narrativeTree[choice.nextStage].outcome
      });
    }
  };

  const resetToStage = (stageId: string) => {
    if (gameState.chronoTokens > 0) {
      setGameState(prev => ({
        ...prev,
        currentStage: stageId,
        chronoTokens: prev.chronoTokens - 1
      }));
    }
  };

  if (!currentStage) {
    return <div>Error: Stage not found</div>;
  }

  return (
    <div className="narrative-engine">
      <div className="stage-content">
        <h2>{currentStage.category?.toUpperCase()}</h2>
        <p className="question">{currentStage.question}</p>
        
        {currentStage.isFatal && (
          <div className="fatal-error">
            <p>Analysis Error Detected</p>
            {currentStage.explanation && (
              <p className="explanation">{currentStage.explanation}</p>
            )}
          </div>
        )}
        
        <div className="choices">
          {currentStage.choices.map((choice, index) => (
            <button
              key={index}
              className={`choice-button ${choice.traits.join(' ')}`}
              onClick={() => makeChoice(choice)}
            >
              {choice.text}
              {choice.reasoning && (
                <span className="reasoning">{choice.reasoning}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="game-ui">
        <div className="trait-display">
          {Object.entries(gameState.userProfile.traits).map(([trait, score]) => (
            <div key={trait} className="trait-bar">
              <label>{trait}</label>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="chrono-tokens">
          Chrono Tokens: {gameState.chronoTokens}
        </div>
      </div>
    </div>
  );
};

export default NarrativeEngine;
'''

print("Generated React component structure.")

# Generate CSS styles
css_styles = '''
/* Styles for The ATLAS Directive */

.narrative-engine {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Orbitron', monospace;
  background: linear-gradient(135deg, #0c0c1e 0%, #1a1a2e 100%);
  color: #e0e0e0;
  min-height: 100vh;
}

.stage-content {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.stage-content h2 {
  color: #00ffff;
  font-size: 1.2em;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.question {
  font-size: 1.1em;
  line-height: 1.6;
  margin-bottom: 30px;
}

.fatal-error {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff4444;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 20px;
}

.explanation {
  font-style: italic;
  color: #ffaa00;
  margin-top: 10px;
}

.choices {
  display: grid;
  gap: 15px;
}

.choice-button {
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  padding: 20px;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 1em;
}

.choice-button:hover {
  background: rgba(0, 255, 255, 0.2);
  border-color: #00ffff;
  transform: translateY(-2px);
}

.choice-button.pragmatist { border-left: 4px solid #4CAF50; }
.choice-button.mystic { border-left: 4px solid #9C27B0; }
.choice-button.idealist { border-left: 4px solid #2196F3; }
.choice-button.cynic { border-left: 4px solid #FF5722; }
.choice-button.risk_taker { border-left: 4px solid #FF9800; }
.choice-button.cautious { border-left: 4px solid #607D8B; }
.choice-button.leader { border-left: 4px solid #FFD700; }
.choice-button.analyst { border-left: 4px solid #00BCD4; }

.reasoning {
  display: block;
  font-size: 0.9em;
  color: #888;
  margin-top: 8px;
  font-style: italic;
}

.game-ui {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: start;
}

.trait-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.trait-bar {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 5px;
}

.trait-bar label {
  display: block;
  font-size: 0.9em;
  margin-bottom: 5px;
  color: #00ffff;
  text-transform: capitalize;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #0099cc);
  transition: width 0.5s ease;
}

.chrono-tokens {
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.5);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  color: #FFD700;
  font-weight: bold;
}
'''

print("Generated CSS styling.")

# Generate shell script for deployment
shell_script = '''#!/bin/bash

# Deployment script for The ATLAS Directive
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-development}
PROJECT_NAME="atlas-directive"
BUILD_DIR="dist"

echo "🚀 Deploying The ATLAS Directive to $ENVIRONMENT"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building project..."
npm run build

# Generate narrative content
echo "📝 Generating narrative content..."
node scripts/generate-content.js

# Run tests
echo "🧪 Running tests..."
npm test

# Deploy to environment
case $ENVIRONMENT in
  "production")
    echo "🌟 Deploying to production..."
    # AWS S3 + CloudFront deployment
    aws s3 sync $BUILD_DIR/ s3://atlas-directive-prod --delete
    aws cloudfront create-invalidation --distribution-id EXAMPLEID --paths "/*"
    ;;
  "staging")
    echo "🎭 Deploying to staging..."
    aws s3 sync $BUILD_DIR/ s3://atlas-directive-staging --delete
    ;;
  "development")
    echo "🔧 Starting development server..."
    npm run dev
    ;;
esac

echo "✅ Deployment complete!"

# Post-deployment verification
echo "🔍 Running post-deployment checks..."
curl -f https://atlas-directive.com/api/health || echo "❌ Health check failed"

echo "🌌 The ATLAS Directive is now live!"
'''

print("Generated deployment shell script.")

print("\n=== CODE GENERATION COMPLETE ===")
print("Generated files:")
print("1. TypeScript interfaces and types")
print("2. JSON narrative tree structure") 
print("3. React component implementation")
print("4. CSS styling system")
print("5. Shell deployment script")
print(f"\nTotal narrative stages: {len(narrative_tree_json)}")
print("Ready for integration into React application.")