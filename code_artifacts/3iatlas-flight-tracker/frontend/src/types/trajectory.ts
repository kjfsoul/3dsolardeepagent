export interface VectorData { x: number; y: number; z: number; }
export interface TrajectoryData { [key: string]: VectorData[] }
export interface TimelineEvent { id?: string; name?: string; date?: string }
