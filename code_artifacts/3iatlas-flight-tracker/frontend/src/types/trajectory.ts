
/**
 * Type definitions for trajectory data
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface VectorData {
  jd?: number;
  date: string;
  position: Vector3D;
  velocity: Vector3D;
  calculated?: boolean;
  distance_au?: number;
  note?: string;
}

export interface TrajectoryData {
  metadata: {
    generated: string;
    date_range: {
      start: string;
      end: string;
      current: string;
    };
    step_size?: string;
    units: {
      distance: string;
      velocity: string;
      time: string;
    };
    source: string;
  };
  '3iatlas'?: VectorData[];
  atlas?: VectorData[];
  mercury?: VectorData[];
  venus?: VectorData[];
  earth: VectorData[];
  ceres?: VectorData[];
  vesta?: VectorData[];
  pallas?: VectorData[];
  mars: VectorData[];
  jupiter: VectorData[];
  saturn?: VectorData[];
  uranus?: VectorData[];
  neptune?: VectorData[];
  pluto?: VectorData[];
}

export interface TimelineEvent {
  id: string;
  name: string;
  date: string;
  distance_au?: number;
  max_velocity_kms?: number;
  description: string;
  type: 'milestone' | 'encounter';
  educational_content?: string;
}

export interface TimelineEventsData {
  events: TimelineEvent[];
}
