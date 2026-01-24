import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  getNutritionInfo,
  formatFoodLabel,
  ACTIVITY_MULTIPLIERS,
} from '../nutrition-logic';

describe('Nutrition Logic', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR for male correctly', () => {
      // Test case: 80kg, 180cm, 25 years old
      const bmr = calculateBMR('male', 80, 180, 25);
      // Expected: (10 * 80) + (6.25 * 180) - (5 * 25) + 5 = 800 + 1125 - 125 + 5 = 1805
      expect(bmr).toBe(1805);
    });

    it('should calculate BMR for female correctly', () => {
      // Test case: 65kg, 165cm, 30 years old
      const bmr = calculateBMR('female', 65, 165, 30);
      // Expected: (10 * 65) + (6.25 * 165) - (5 * 30) - 161 = 650 + 1031.25 - 150 - 161 = 1370.25 ≈ 1370
      expect(bmr).toBeCloseTo(1370.25, 1);
    });

    it('should calculate BMR for other gender correctly', () => {
      // Test case: 75kg, 175cm, 28 years old
      const bmr = calculateBMR('other', 75, 175, 28);
      // Expected: (10 * 75) + (6.25 * 175) - (5 * 28) - 78 = 750 + 1093.75 - 140 - 78 = 1625.75
      expect(bmr).toBeCloseTo(1625.75, 1);
    });

    it('should handle edge cases', () => {
      const bmr = calculateBMR('male', 50, 150, 20);
      expect(bmr).toBeGreaterThan(0);
      expect(typeof bmr).toBe('number');
    });
  });

  describe('calculateTDEE', () => {
    it('should calculate TDEE with sedentary activity level', () => {
      const tdee = calculateTDEE(1800, 'sedentary');
      expect(tdee).toBe(Math.round(1800 * 1.2));
    });

    it('should calculate TDEE with lightly active activity level', () => {
      const tdee = calculateTDEE(1800, 'lightly_active');
      expect(tdee).toBe(Math.round(1800 * 1.375));
    });

    it('should calculate TDEE with moderately active activity level', () => {
      const tdee = calculateTDEE(1800, 'moderately_active');
      expect(tdee).toBe(Math.round(1800 * 1.55));
    });

    it('should calculate TDEE with very active activity level', () => {
      const tdee = calculateTDEE(1800, 'very_active');
      expect(tdee).toBe(Math.round(1800 * 1.725));
    });

    it('should calculate TDEE with super active activity level', () => {
      const tdee = calculateTDEE(1800, 'super_active');
      expect(tdee).toBe(Math.round(1800 * 1.9));
    });

    it('should handle spaces in activity level', () => {
      const tdee1 = calculateTDEE(1800, 'lightly active');
      const tdee2 = calculateTDEE(1800, 'lightly_active');
      expect(tdee1).toBe(tdee2);
    });

    it('should default to sedentary for unknown activity level', () => {
      const tdee = calculateTDEE(1800, 'unknown_level');
      expect(tdee).toBe(Math.round(1800 * 1.2));
    });

    it('should return integer value', () => {
      const tdee = calculateTDEE(1800, 'moderately_active');
      expect(Number.isInteger(tdee)).toBe(true);
    });
  });

  describe('getNutritionInfo', () => {
    it('should return nutrition info for known food', () => {
      const info = getNutritionInfo('pizza');
      expect(info.calories).toBe(266);
      expect(info.unit).toBe('slice');
    });

    it('should return nutrition info for hamburger', () => {
      const info = getNutritionInfo('hamburger');
      expect(info.calories).toBe(295);
      expect(info.unit).toBe('burger');
    });

    it('should handle case insensitivity', () => {
      const info1 = getNutritionInfo('PIZZA');
      const info2 = getNutritionInfo('pizza');
      expect(info1).toEqual(info2);
    });

    it('should handle underscores and spaces', () => {
      const info1 = getNutritionInfo('chicken_wings');
      const info2 = getNutritionInfo('chicken wings');
      expect(info1).toEqual(info2);
    });

    it('should return fallback for unknown food', () => {
      const info = getNutritionInfo('unknown_food');
      expect(info.calories).toBe(250);
      expect(info.unit).toBe('serving (est)');
    });

    it('should have calories and unit properties', () => {
      const info = getNutritionInfo('pizza');
      expect(info).toHaveProperty('calories');
      expect(info).toHaveProperty('unit');
      expect(typeof info.calories).toBe('number');
      expect(typeof info.unit).toBe('string');
    });
  });

  describe('formatFoodLabel', () => {
    it('should format underscored labels', () => {
      expect(formatFoodLabel('pizza')).toBe('Pizza');
      expect(formatFoodLabel('chicken_wings')).toBe('Chicken Wings');
      expect(formatFoodLabel('beef_carpaccio')).toBe('Beef Carpaccio');
    });

    it('should capitalize first letter', () => {
      expect(formatFoodLabel('pizza')).toBe('Pizza');
      expect(formatFoodLabel('PIZZA')).toBe('Pizza');
    });

    it('should handle multiple underscores', () => {
      expect(formatFoodLabel('chicken_quesadilla')).toBe('Chicken Quesadilla');
      expect(formatFoodLabel('eggs_benedict')).toBe('Eggs Benedict');
    });

    it('should return formatted string', () => {
      const result = formatFoodLabel('pizza');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('ACTIVITY_MULTIPLIERS', () => {
    it('should have all activity levels defined', () => {
      expect(ACTIVITY_MULTIPLIERS.sedentary).toBe(1.2);
      expect(ACTIVITY_MULTIPLIERS.lightly_active).toBe(1.375);
      expect(ACTIVITY_MULTIPLIERS.moderately_active).toBe(1.55);
      expect(ACTIVITY_MULTIPLIERS.very_active).toBe(1.725);
      expect(ACTIVITY_MULTIPLIERS.super_active).toBe(1.9);
    });

    it('should have multipliers greater than 1', () => {
      Object.values(ACTIVITY_MULTIPLIERS).forEach((multiplier) => {
        expect(multiplier).toBeGreaterThan(1);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should calculate complete TDEE workflow', () => {
      // Male, 80kg, 180cm, 25 years, moderately active
      const bmr = calculateBMR('male', 80, 180, 25);
      const tdee = calculateTDEE(bmr, 'moderately_active');

      expect(bmr).toBe(1805);
      expect(tdee).toBe(Math.round(1805 * 1.55));
      expect(tdee).toBeGreaterThan(bmr);
    });

    it('should handle meal logging workflow', () => {
      const foodLabel = 'pizza';
      const nutrition = getNutritionInfo(foodLabel);
      const formatted = formatFoodLabel(foodLabel);

      expect(nutrition.calories).toBe(266);
      expect(formatted).toBe('Pizza');
    });
  });
});
