export type FitnessGoal = 'weight-loss' | 'maintenance' | 'muscle-gain';

export interface GoalTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  weight: number; // in grams
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface RunningTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AppState {
  meals: Meal[];
  currentGoal: FitnessGoal;
  targets: GoalTargets;
  totals: RunningTotals;
  exceeded: boolean;
}
