/**
 * View Manager for 3I/ATLAS 5-View System
 * Manages view switching, state persistence, and data flow
 */

export type ViewType = 'historical' | 'currentMoment' | 'speedSimulation' | 'perihelionEvent' | 'trajectoryPlotter';

export interface ViewState {
  currentView: ViewType;
  isPlaying: boolean;
  speed: number;
  currentDate: string;
  selectedObject: string | null;
  loading: boolean;
  error: string | null;
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  cameraTarget: {
    x: number;
    y: number;
    z: number;
  };
}

export interface ViewData {
  historical: any[];
  currentMoment: any;
  physics: any;
  trajectory: any;
}

export class ViewManager {
  private state: ViewState;
  private data: ViewData;
  private listeners: Set<(state: ViewState) => void> = new Set();

  constructor() {
    this.state = {
      currentView: 'historical',
      isPlaying: true,
      speed: 5,
      currentDate: '',
      selectedObject: null,
      loading: true,
      error: null,
      cameraPosition: { x: 8, y: 6, z: 8 },
      cameraTarget: { x: 0, y: 0, z: 0 }
    };
    this.data = {
      historical: [],
      currentMoment: null,
      physics: null,
      trajectory: null
    };
  }

  getState(): ViewState {
    return { ...this.state };
  }

  setView(view: ViewType): void {
    if (this.state.currentView !== view) {
      this.state.currentView = view;
      this.notifyListeners();
    }
  }

  setPlaying(isPlaying: boolean): void {
    this.state.isPlaying = isPlaying;
    this.notifyListeners();
  }

  setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(100, speed));
    this.notifyListeners();
  }

  setCurrentDate(date: string): void {
    this.state.currentDate = date;
    this.notifyListeners();
  }

  setSelectedObject(object: string | null): void {
    this.state.selectedObject = object;
    this.notifyListeners();
  }

  setLoading(loading: boolean): void {
    this.state.loading = loading;
    this.notifyListeners();
  }

  setError(error: string | null): void {
    this.state.error = error;
    this.notifyListeners();
  }

  setCameraPosition(position: { x: number; y: number; z: number }): void {
    this.state.cameraPosition = { ...position };
    this.notifyListeners();
  }

  setCameraTarget(target: { x: number; y: number; z: number }): void {
    this.state.cameraTarget = { ...target };
    this.notifyListeners();
  }

  setViewData(viewType: keyof ViewData, data: any): void {
    this.data[viewType] = data;
  }

  getViewData(viewType: keyof ViewData): any {
    return this.data[viewType];
  }

  subscribe(listener: (state: ViewState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // View-specific camera presets
  getCameraPreset(view: ViewType): { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } } {
    const presets = {
      historical: {
        position: { x: 15, y: 10, z: 15 },
        target: { x: 0, y: 0, z: 0 }
      },
      currentMoment: {
        position: { x: 8, y: 6, z: 8 },
        target: { x: 0, y: 0, z: 0 }
      },
      speedSimulation: {
        position: { x: 2, y: 1, z: 2 },
        target: { x: 0, y: 0, z: 0 }
      },
      perihelionEvent: {
        position: { x: 5, y: 3, z: 5 },
        target: { x: 0, y: 0, z: 0 }
      },
      trajectoryPlotter: {
        position: { x: 20, y: 15, z: 20 },
        target: { x: 0, y: 0, z: 0 }
      }
    };
    return presets[view];
  }
}

// Global view manager instance
export const viewManager = new ViewManager();
