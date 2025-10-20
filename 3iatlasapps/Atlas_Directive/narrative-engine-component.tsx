// React Component for The ATLAS Directive Narrative Engine

import React, { useState, useEffect, useCallback } from 'react';
import { Stage, Choice, GameState, UserProfile, Outcome } from './atlas-directive-types';
import './AtlasDirective.css';

// Extend window type for gtag
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
  }
}

interface NarrativeEngineProps {
  narrativeTree: { [key: string]: Stage };
  onGameComplete: (profile: UserProfile) => void;
  onAnalyticsEvent?: (eventType: string, data: Record<string, unknown>) => void;
}

const NarrativeEngine: React.FC<NarrativeEngineProps> = ({ 
  narrativeTree, 
  onGameComplete,
  onAnalyticsEvent 
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

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTraits, setShowTraits] = useState(false);

  const currentStage = narrativeTree[gameState.currentStage];

  // Track analytics events
  const trackEvent = useCallback((eventType: string, data: Record<string, unknown>) => {
    if (onAnalyticsEvent) {
      onAnalyticsEvent(eventType, {
        ...data,
        stageId: gameState.currentStage,
        timestamp: new Date().toISOString(),
        traits: gameState.userProfile.traits
      });
    }
  }, [onAnalyticsEvent, gameState.currentStage, gameState.userProfile.traits]);

  const makeChoice = async (choice: Choice) => {
    setIsTransitioning(true);
    
    // Track choice made
    trackEvent('choice_made', {
      choiceText: choice.text,
      choiceTraits: choice.traits,
      reasoning: choice.reasoning
    });

    // Update trait scores with animation delay
    setTimeout(() => {
      const updatedTraits = { ...gameState.userProfile.traits };
      choice.traits.forEach((trait: string) => {
        updatedTraits[trait] = Math.min(100, updatedTraits[trait] + 12);
      });

      // Update game state
      const newGameState = {
        ...gameState,
        currentStage: choice.nextStage,
        userProfile: {
          ...gameState.userProfile,
          traits: updatedTraits,
          choices: [...gameState.userProfile.choices, choice],
          path: [...gameState.userProfile.path, choice.nextStage]
        },
        completedStages: [...gameState.completedStages, gameState.currentStage]
      };

      setGameState(newGameState);

      // Check for game completion
      const nextStage = narrativeTree[choice.nextStage];
      if (nextStage?.outcome) {
        trackEvent('outcome_reached', {
          outcome: nextStage.outcome.title,
          rarity: nextStage.outcome.rarity,
          pathLength: newGameState.userProfile.path.length
        });

        onGameComplete({
          ...newGameState.userProfile,
          outcome: nextStage.outcome
        });
      }

      setIsTransitioning(false);
    }, 300);
  };

  const resetToStage = (stageId: string) => {
    if (gameState.chronoTokens > 0) {
      trackEvent('token_used', { targetStage: stageId });
      
      setGameState((prev: GameState) => ({
        ...prev,
        currentStage: stageId,
        chronoTokens: prev.chronoTokens - 1
      }));
    }
  };

  const getDominantTrait = () => {
    const traits = gameState.userProfile.traits;
    return Object.keys(traits).reduce((a, b) => 
      (traits as any)[a] > (traits as any)[b] ? a : b
    );
  };

  if (!currentStage) {
    return (
      <div className="narrative-error">
        <h2>Navigation Error</h2>
        <p>Stage "{gameState.currentStage}" not found in narrative tree.</p>
        <button onClick={() => resetToStage('start')}>Return to Start</button>
      </div>
    );
  }

  return (
    <div className={`narrative-engine ${isTransitioning ? 'transitioning' : ''}`}>
      {/* Main Content Area */}
      <div className="stage-content">
        <div className="stage-header">
          <h2 className={`stage-category ${currentStage.category}`}>
            {currentStage.category?.replace('_', ' ').toUpperCase() || 'ATLAS DIRECTIVE'}
          </h2>
          
          {currentStage.isFatal && (
            <div className="fatal-indicator">
              ⚠️ ANALYSIS ERROR
            </div>
          )}
        </div>

        <div className="question-container">
          <p className="question">{currentStage.question}</p>
          
          {currentStage.explanation && (
            <div className="explanation">
              <h4>Analysis:</h4>
              <p>{currentStage.explanation}</p>
            </div>
          )}
        </div>
        
        <div className="choices-container">
          {currentStage.choices.map((choice: Choice, index: number) => (
            <button
              key={index}
              className={`choice-button ${choice.traits.join(' ')} ${isTransitioning ? 'disabled' : ''}`}
              onClick={() => !isTransitioning && makeChoice(choice)}
              disabled={isTransitioning}
            >
              <div className="choice-text">{choice.text}</div>
              
              {choice.traits.length > 0 && (
                <div className="choice-traits">
                  {choice.traits.map((trait: string) => (
                    <span key={trait} className={`trait-tag ${trait}`}>
                      {trait.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
              
              {choice.reasoning && (
                <div className="choice-reasoning">
                  {choice.reasoning}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Outcome Display */}
        {currentStage.outcome && (
          <div className={`outcome-display ${currentStage.outcome.rarity.toLowerCase()}`}>
            <h2>Mission Complete: {currentStage.outcome.title}</h2>
            <div className="outcome-rarity">
              Classification: {currentStage.outcome.rarity}
            </div>
            <p className="outcome-narrative">{currentStage.outcome.narrative}</p>
          </div>
        )}
      </div>

      {/* Side Panel UI */}
      <div className="game-ui-panel">
        <div className="ui-section chrono-tokens">
          <h3>Chrono Tokens</h3>
          <div className="token-count">
            {'⧗'.repeat(gameState.chronoTokens)}
            <span className="token-text">{gameState.chronoTokens}</span>
          </div>
          <p className="token-help">Use to revisit previous decisions</p>
        </div>

        <div className="ui-section trait-analysis">
          <h3 
            className="trait-toggle" 
            onClick={() => setShowTraits(!showTraits)}
          >
            Psychological Profile {showTraits ? '▼' : '▶'}
          </h3>
          
          {showTraits && (
            <div className="trait-display">
              {Object.entries(gameState.userProfile.traits)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([trait, score]) => (
                  <div key={trait} className="trait-bar">
                    <label className="trait-label">
                      {trait.replace('_', ' ')}
                      <span className="trait-score">{score as number}%</span>
                    </label>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${trait}`}
                        style={{ width: `${(score as number)}%` }}
                      />
                    </div>
                  </div>
                ))}
              
              <div className="dominant-trait">
                <strong>Primary Trait: {getDominantTrait().replace('_', ' ')}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="ui-section mission-status">
          <h3>Mission Progress</h3>
          <div className="progress-stats">
            <div>Stages Completed: {gameState.completedStages.length}</div>
            <div>Decisions Made: {gameState.userProfile.choices.length}</div>
            <div>Path Depth: {gameState.userProfile.path.length}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ui-section quick-actions">
          <button 
            className="ui-button"
            onClick={() => setShowTraits(!showTraits)}
          >
            {showTraits ? 'Hide' : 'Show'} Analysis
          </button>
          
          {gameState.chronoTokens > 0 && gameState.completedStages.length > 0 && (
            <button 
              className="ui-button chrono-button"
              onClick={() => resetToStage(gameState.completedStages[gameState.completedStages.length - 1])}
            >
              Use Chrono Token
            </button>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isTransitioning && (
        <div className="transition-overlay">
          <div className="loading-spinner">
            <div className="orbit-loader">
              <div className="orbit-path">
                <div className="orbit-object"></div>
              </div>
            </div>
            <p>Processing Analysis...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Higher-order component for analytics integration
export const withAnalytics = (WrappedComponent: React.ComponentType<NarrativeEngineProps>) => {
  return (props: NarrativeEngineProps) => {
    const handleAnalyticsEvent = (eventType: string, data: Record<string, unknown>) => {
      // Integration with analytics service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventType, {
          custom_parameter_1: data.stageId,
          custom_parameter_2: data.choiceText,
          value: data.traits ? Object.values(data.traits as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : 0
        });
      }
      
      // Local analytics storage
      const analyticsData = {
        ...data,
        sessionId: sessionStorage.getItem('atlas-session-id') || 'anonymous',
        timestamp: new Date().toISOString()
      };
      
      const events = JSON.parse(localStorage.getItem('atlas-analytics') || '[]');
      events.push(analyticsData);
      localStorage.setItem('atlas-analytics', JSON.stringify(events.slice(-100))); // Keep last 100 events
    };

    return (
      <WrappedComponent 
        {...props} 
        onAnalyticsEvent={handleAnalyticsEvent}
      />
    );
  };
};

export default NarrativeEngine;
