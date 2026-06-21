import { AppState, FitnessGoal, Meal, GoalTargets, RunningTotals } from '../types';

export const GOAL_TARGETS: Record<FitnessGoal, GoalTargets> = {
  'weight-loss': { calories: 1600, protein: 120, carbs: 150, fat: 50 },
  'maintenance': { calories: 2200, protein: 140, carbs: 250, fat: 70 },
  'muscle-gain': { calories: 2800, protein: 180, carbs: 320, fat: 90 },
};

// Base nutrient database (values are per 100g)
export interface FoodDatabaseEntry {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const FOOD_DATABASE: Record<string, FoodDatabaseEntry> = {
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'white rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13 },
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  'peanut butter': { calories: 588, protein: 25, carbs: 20, fat: 50 },
  'oatmeal': { calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  'greek yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
};

// Fallback for custom food (per 100g)
export const DEFAULT_FOOD_ENTRY: FoodDatabaseEntry = {
  calories: 120,
  protein: 5,
  carbs: 15,
  fat: 3,
};

// List of pre-scanned mock foods for AI scanner simulation
export const MOCK_SCAN_ITEMS = [
  { name: 'Avocado Toast', weight: 150 },
  { name: 'Grilled Chicken Salad', weight: 250 },
  { name: 'Salmon with White Rice', weight: 350 },
  { name: 'Greek Yogurt with Banana', weight: 200 },
  { name: 'Protein Oatmeal with Peanut Butter', weight: 180 },
];

// Initialize default state
const initialMeals: Meal[] = [
  {
    id: '1',
    name: 'Oatmeal with Peanut Butter',
    weight: 150,
    calories: 420,
    protein: 15.2,
    carbs: 58.5,
    fat: 14.8,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
  },
  {
    id: '2',
    name: 'Chicken Breast',
    weight: 200,
    calories: 330,
    protein: 62.0,
    carbs: 0.0,
    fat: 7.2,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
];

// Global type augmentation
declare global {
  var __calorieTrackerState: {
    meals: Meal[];
    currentGoal: FitnessGoal;
  } | undefined;
}

// Ensure the state persists during hot-reloading in dev environment
if (!global.__calorieTrackerState) {
  global.__calorieTrackerState = {
    meals: initialMeals,
    currentGoal: 'maintenance',
  };
}

const localStore = global.__calorieTrackerState;

// Fuzzy food matcher to look up food items
export function findFoodInDatabase(name: string): { entry: FoodDatabaseEntry; matchedName: string } {
  const query = name.toLowerCase().trim();

  // Try direct match first
  if (FOOD_DATABASE[query]) {
    return { entry: FOOD_DATABASE[query], matchedName: name };
  }

  // Try fuzzy/substring match
  for (const key of Object.keys(FOOD_DATABASE)) {
    if (query.includes(key) || key.includes(query)) {
      // capitalize key first letters for presentation
      const displayName = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { entry: FOOD_DATABASE[key], matchedName: displayName };
    }
  }

  // If no match is found, return the custom default entry
  return { entry: DEFAULT_FOOD_ENTRY, matchedName: name || 'Custom Meal' };
}

// Calculate running totals
function calculateTotals(meals: Meal[]): RunningTotals {
  const totals: RunningTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const meal of meals) {
    totals.calories += meal.calories;
    totals.protein += meal.protein;
    totals.carbs += meal.carbs;
    totals.fat += meal.fat;
  }
  
  // Format to 1 decimal place to prevent floating point issues in presentation
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

// Main getState function
export function getAppState(): AppState {
  const currentGoal = localStore.currentGoal;
  const meals = localStore.meals;
  const targets = GOAL_TARGETS[currentGoal];
  const totals = calculateTotals(meals);
  const exceeded = totals.calories > targets.calories;

  return {
    meals,
    currentGoal,
    targets,
    totals,
    exceeded,
  };
}

// Add meal business logic
export function addMeal(name: string, weightGrams: number): AppState {
  const { entry, matchedName } = findFoodInDatabase(name);
  
  // Scale nutrients per portion size
  const scale = weightGrams / 100;
  const meal: Meal = {
    id: Math.random().toString(36).substring(2, 9),
    name: matchedName,
    weight: weightGrams,
    calories: Math.round(entry.calories * scale),
    protein: Math.round(entry.protein * scale * 10) / 10,
    carbs: Math.round(entry.carbs * scale * 10) / 10,
    fat: Math.round(entry.fat * scale * 10) / 10,
    createdAt: new Date().toISOString(),
  };

  localStore.meals.unshift(meal); // add to top
  return getAppState();
}

// Delete meal business logic
export function deleteMeal(id: string): AppState {
  localStore.meals = localStore.meals.filter(meal => meal.id !== id);
  return getAppState();
}

// Update goal business logic
export function updateGoal(goal: FitnessGoal): AppState {
  localStore.currentGoal = goal;
  return getAppState();
}

// Get mock food scanner item
export function getMockScanResult() {
  const index = Math.floor(Math.random() * MOCK_SCAN_ITEMS.length);
  return MOCK_SCAN_ITEMS[index];
}
