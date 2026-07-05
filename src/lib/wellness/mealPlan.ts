export interface DailyIngredient {
  item: string;
  amount: string;
}

export interface DailyMacros {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export interface ScheduledMeal {
  id: string;
  label: string;
  items: string[];
}

export const DAILY_INGREDIENTS: DailyIngredient[] = [
  { item: "Chicken breast, cooked", amount: "14 oz" },
  { item: "Eggs", amount: "4 whole eggs" },
  { item: "White rice, cooked", amount: "2 cups" },
  { item: "Nutricost whey protein", amount: "2 scoops" },
];

export const DAILY_MACROS: DailyMacros = {
  calories: "~1,600–1,700",
  protein: "~205 g",
  carbs: "~90 g",
  fat: "~40 g",
};

const MEAL_TEMPLATE: Omit<ScheduledMeal, "id">[] = [
  { label: "Meal 1", items: ["4 eggs", "1 scoop whey"] },
  { label: "Meal 2", items: ["7 oz cooked chicken", "1 cup cooked rice"] },
  { label: "Meal 3", items: ["1 scoop whey"] },
  { label: "Meal 4", items: ["7 oz cooked chicken", "1 cup cooked rice"] },
];

import { isProgramDay } from "@/lib/wellness/programStart";

export function mealsForDate(dateIso: string): ScheduledMeal[] {
  if (!isProgramDay(dateIso)) return [];
  return MEAL_TEMPLATE.map((meal, i) => ({
    ...meal,
    id: `${dateIso}-meal-${i + 1}`,
  }));
}

export function mealSummary(): string {
  return "4 meals";
}
