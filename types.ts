
export enum NoiseLevel {
  QUIET = 'QUIET',
  MODERATE = 'MODERATE',
  NOISY = 'NOISY'
}

export interface NoiseRecord {
  id: string;
  latitude: number;
  longitude: number;
  decibels: number;
  timestamp: number;
  locationName?: string;
  notes?: string;
}

export interface AIInsight {
  summary: string;
  recommendations: string[];
  urbanPlanningScore: number;
}
