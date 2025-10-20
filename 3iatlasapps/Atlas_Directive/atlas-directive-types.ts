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

// Content Generation Types
interface ScientificFact {
  category: string;
  question: string;
  correct: string;
  distractors: string[];
  explanation: string;
}

interface SituationalDilemma {
  category: string;
  scenario: string;
  question: string;
  choices: DilemmaChoice[];
}

interface DilemmaChoice {
  text: string;
  traits: string[];
  reasoning: string;
}

interface PhilosophicalProbe {
  category: string;
  context: string;
  question: string;
  choices: PhilosophyChoice[];
}

interface PhilosophyChoice {
  text: string;
  traits: string[];
  worldview: string;
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface NASAHorizonsData {
  position: [number, number, number];
  velocity: [number, number, number]; 
  timestamp: string;
}

// Analytics and Tracking
interface AnalyticsEvent {
  eventType: 'choice_made' | 'stage_completed' | 'outcome_reached' | 'token_used';
  stageId: string;
  choiceText?: string;
  traits?: string[];
  timestamp: string;
  userId: string;
}

interface UserAnalytics {
  userId: string;
  sessionId: string;
  startTime: string;
  events: AnalyticsEvent[];
  finalOutcome?: string;
  completionTime?: number;
  traitScores: { [trait: string]: number };
}

export type {
  Choice,
  Stage,
  Outcome,
  UserProfile,
  NarrativeTree,
  GameState,
  ScientificFact,
  SituationalDilemma,
  DilemmaChoice,
  PhilosophicalProbe,
  PhilosophyChoice,
  ApiResponse,
  NASAHorizonsData,
  AnalyticsEvent,
  UserAnalytics
};