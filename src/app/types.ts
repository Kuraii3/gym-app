export interface Exercise {
  id: string;
  name: string;
}

export interface Split {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface SetLog {
  weight: string;
  reps: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  notes: string;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  splitId: string;
  splitName: string;
  date: string; // ISO string
  exercises: ExerciseLog[];
}

export interface AppSettings {
  restTimerEnabled: boolean;
  restTimerDuration: number; // seconds
}
