/**
 * Nutrition Logic - TDEE Calculation and Food Nutrition Data
 * Based on calorie_logic.py and food_labels.json
 */

// Activity level multipliers for TDEE calculation
export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,           // Little or no exercise
  lightly_active: 1.375,    // Light exercise 1-3 days/week
  moderately_active: 1.55,  // Moderate exercise 3-5 days/week
  very_active: 1.725,       // Hard exercise 6-7 days/week
  super_active: 1.9,        // Very hard exercise + physical job
};

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation.
 * 
 * Formula:
 * Men: (10 × weight) + (6.25 × height) - (5 × age) + 5
 * Women: (10 × weight) + (6.25 × height) - (5 × age) - 161
 * 
 * @param gender - 'male', 'female', or 'other'
 * @param weight_kg - Weight in kilograms
 * @param height_cm - Height in centimeters
 * @param age - Age in years
 * @returns BMR in kcal/day
 */
export function calculateBMR(
  gender: 'male' | 'female' | 'other',
  weight_kg: number,
  height_cm: number,
  age: number
): number {
  const baseCalc = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);

  if (gender === 'male') {
    return baseCalc + 5;
  } else if (gender === 'female') {
    return baseCalc - 161;
  } else {
    // Fallback average for 'other'
    return baseCalc - 78;
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on activity level.
 * 
 * @param bmr - Basal Metabolic Rate in kcal/day
 * @param activityLevel - One of: 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'super_active'
 * @returns TDEE in kcal/day (rounded to nearest integer)
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: string
): number {
  const normalizedLevel = activityLevel.toLowerCase().replace(/\s+/g, '_');
  const multiplier = ACTIVITY_MULTIPLIERS[normalizedLevel] || 1.2; // Default to sedentary
  return Math.round(bmr * multiplier);
}

/**
 * Food-101 Nutrition Mapping
 * Estimated calories and serving units for each food label
 */
export const FOOD_101_NUTRITION_MAP: Record<
  string,
  { calories: number; unit: string }
> = {
  apple_pie: { calories: 237, unit: 'slice (100g)' },
  baby_back_ribs: { calories: 361, unit: '1/2 rack' },
  baklava: { calories: 334, unit: 'piece' },
  beef_carpaccio: { calories: 140, unit: 'serving' },
  beef_tartare: { calories: 240, unit: 'serving' },
  beet_salad: { calories: 120, unit: 'serving' },
  beignets: { calories: 220, unit: 'piece' },
  bibimbap: { calories: 490, unit: 'bowl' },
  bread_pudding: { calories: 270, unit: 'slice' },
  breakfast_burrito: { calories: 290, unit: 'burrito' },
  bruschetta: { calories: 50, unit: 'piece' },
  caesar_salad: { calories: 180, unit: 'serving' },
  cannoli: { calories: 200, unit: 'piece' },
  caprese_salad: { calories: 220, unit: 'serving' },
  carrot_cake: { calories: 350, unit: 'slice' },
  ceviche: { calories: 140, unit: 'cup' },
  cheesecake: { calories: 321, unit: 'slice' },
  cheese_plate: { calories: 450, unit: 'serving' },
  chicken_curry: { calories: 340, unit: 'serving' },
  chicken_quesadilla: { calories: 520, unit: 'quesadilla' },
  chicken_wings: { calories: 203, unit: '3 wings' },
  chocolate_cake: { calories: 371, unit: 'slice' },
  chocolate_mousse: { calories: 225, unit: 'cup' },
  churros: { calories: 116, unit: 'piece' },
  clam_chowder: { calories: 250, unit: 'cup' },
  club_sandwich: { calories: 590, unit: 'sandwich' },
  crab_cakes: { calories: 160, unit: 'cake' },
  creme_brulee: { calories: 280, unit: 'serving' },
  croque_madame: { calories: 410, unit: 'sandwich' },
  cup_cakes: { calories: 250, unit: 'cupcake' },
  deviled_eggs: { calories: 60, unit: 'half egg' },
  donuts: { calories: 195, unit: 'donut' },
  dumplings: { calories: 40, unit: 'dumpling' },
  edamame: { calories: 121, unit: 'cup' },
  eggs_benedict: { calories: 600, unit: 'serving' },
  escargots: { calories: 80, unit: 'serving' },
  falafel: { calories: 57, unit: 'ball' },
  filet_mignon: { calories: 320, unit: 'steak' },
  fish_and_chips: { calories: 690, unit: 'serving' },
  foie_gras: { calories: 460, unit: 'serving' },
  french_fries: { calories: 312, unit: 'medium' },
  french_onion_soup: { calories: 290, unit: 'bowl' },
  french_toast: { calories: 229, unit: 'slice' },
  fried_calamari: { calories: 340, unit: 'serving' },
  fried_rice: { calories: 330, unit: 'cup' },
  frozen_yogurt: { calories: 110, unit: 'cup' },
  garlic_bread: { calories: 150, unit: 'slice' },
  gnocchi: { calories: 250, unit: 'cup' },
  greek_salad: { calories: 210, unit: 'serving' },
  grilled_cheese_sandwich: { calories: 390, unit: 'sandwich' },
  grilled_salmon: { calories: 350, unit: 'fillet' },
  guacamole: { calories: 150, unit: 'serving' },
  gyoza: { calories: 50, unit: 'piece' },
  hamburger: { calories: 295, unit: 'burger' },
  hot_and_sour_soup: { calories: 90, unit: 'bowl' },
  hot_dog: { calories: 150, unit: 'dog' },
  hummus: { calories: 170, unit: '3 tbsp' },
  ice_cream: { calories: 207, unit: 'scoop' },
  lasagna: { calories: 450, unit: 'slice' },
  lobster_bisque: { calories: 300, unit: 'cup' },
  lobster_roll_sandwich: { calories: 420, unit: 'roll' },
  macaroni_and_cheese: { calories: 350, unit: 'cup' },
  macarons: { calories: 70, unit: 'cookie' },
  miso_soup: { calories: 40, unit: 'bowl' },
  mussels: { calories: 175, unit: 'serving' },
  nachos: { calories: 450, unit: 'serving' },
  omelette: { calories: 154, unit: 'serving' },
  onion_rings: { calories: 410, unit: 'medium' },
  oysters: { calories: 50, unit: '6 oysters' },
  pad_thai: { calories: 350, unit: 'cup' },
  paella: { calories: 350, unit: 'cup' },
  pancakes: { calories: 64, unit: 'pancake' },
  panna_cotta: { calories: 330, unit: 'serving' },
  peking_duck: { calories: 400, unit: 'serving' },
  pho: { calories: 350, unit: 'bowl' },
  pizza: { calories: 266, unit: 'slice' },
  pork_chop: { calories: 290, unit: 'chop' },
  poutine: { calories: 510, unit: 'serving' },
  prime_rib: { calories: 600, unit: 'slice' },
  pulled_pork_sandwich: { calories: 550, unit: 'sandwich' },
  ramen: { calories: 436, unit: 'bowl' },
  ravioli: { calories: 300, unit: 'serving' },
  red_velvet_cake: { calories: 360, unit: 'slice' },
  risotto: { calories: 330, unit: 'cup' },
  samosa: { calories: 150, unit: 'piece' },
  sashimi: { calories: 40, unit: 'piece' },
  scallops: { calories: 110, unit: 'serving' },
  seaweed_salad: { calories: 106, unit: 'serving' },
  shrimp_and_grits: { calories: 450, unit: 'serving' },
  spaghetti_bolognese: { calories: 330, unit: 'cup' },
  spaghetti_carbonara: { calories: 380, unit: 'cup' },
  spring_rolls: { calories: 100, unit: 'roll' },
  steak: { calories: 400, unit: 'steak' },
  strawberry_shortcake: { calories: 250, unit: 'slice' },
  sushi: { calories: 45, unit: 'roll' },
  tacos: { calories: 170, unit: 'taco' },
  takoyaki: { calories: 40, unit: 'ball' },
  tiramisu: { calories: 360, unit: 'slice' },
  tuna_tartare: { calories: 160, unit: 'serving' },
  waffles: { calories: 82, unit: 'waffle' },
};

/**
 * Retrieves nutrition information for a predicted food label.
 * 
 * @param foodLabel - The predicted food label (e.g., 'pizza', 'hamburger')
 * @returns Object with calories and unit, or default fallback if not found
 */
export function getNutritionInfo(
  foodLabel: string
): { calories: number; unit: string } {
  const normalized = foodLabel.toLowerCase().replace(/\s+/g, '_');
  return (
    FOOD_101_NUTRITION_MAP[normalized] || {
      calories: 250,
      unit: 'serving (est)',
    }
  );
}

/**
 * Formats a food label for display (e.g., 'pizza' → 'Pizza')
 */
export function formatFoodLabel(label: string): string {
  return label
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
