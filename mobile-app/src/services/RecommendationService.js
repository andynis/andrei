import DatabaseService from '../database/DatabaseService';
import RecipeService from './RecipeService';

class RecommendationService {
  constructor() {
    this.userProfile = null;
    this.userAllergens = [];
    this.userPreferences = [];
    this.userDiseases = [];
    this.fridgeInventory = [];
  }

  /**
   * Initialize recommendation engine with user data
   */
  async initialize(userId) {
    try {
      this.userProfile = await DatabaseService.getUserProfile();
      this.userAllergens = await DatabaseService.getAllergens(userId);
      this.userPreferences = await DatabaseService.getFoodPreferences(userId);
      this.userDiseases = await DatabaseService.getDiseases(userId);
      this.fridgeInventory = await DatabaseService.getFridgeInventory();
    } catch (error) {
      console.error('Error initializing recommendation service:', error);
    }
  }

  /**
   * Generate personalized recipe recommendations
   * @param {number} userId - User ID
   * @param {number} limit - Number of recommendations to return
   * @returns {array} List of recommended recipes
   */
  async getRecommendations(userId, limit = 10) {
    await this.initialize(userId);

    // Get all recipes from database
    const allRecipes = await DatabaseService.getRecipes();

    // Also fetch new recipes from external sources
    const externalRecipes = await RecipeService.searchRecipesByIngredients(
      this.getAvailableIngredients()
    );

    // Combine and score recipes
    const combinedRecipes = [...allRecipes, ...externalRecipes];
    const scoredRecipes = combinedRecipes.map(recipe => ({
      ...recipe,
      score: this.calculateRecipeScore(recipe),
    }));

    // Sort by score and filter
    const recommendations = scoredRecipes
      .filter(recipe => recipe.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Save recommendations to database
    for (const recipe of recommendations) {
      const reason = this.generateRecommendationReason(recipe);
      await DatabaseService.saveRecommendation(
        userId,
        recipe.id,
        recipe.score,
        reason
      );
    }

    return recommendations;
  }

  /**
   * Calculate recommendation score for a recipe
   * @param {object} recipe - Recipe object
   * @returns {number} Recommendation score (0-100)
   */
  calculateRecipeScore(recipe) {
    let score = 50; // Base score

    const ingredients = this.parseIngredients(recipe.ingredients);

    // Factor 1: Ingredient availability in fridge (30 points)
    const availabilityScore = this.calculateIngredientAvailability(ingredients);
    score += availabilityScore * 30;

    // Factor 2: User preferences (25 points)
    const preferenceScore = this.calculatePreferenceMatch(recipe, ingredients);
    score += preferenceScore * 25;

    // Factor 3: Allergen check (critical - can eliminate recipe)
    if (this.containsAllergens(ingredients)) {
      return 0; // Disqualify recipes with allergens
    }

    // Factor 4: Dietary restrictions from diseases (15 points penalty if violated)
    const diseaseCompatibility = this.checkDiseaseCompatibility(recipe, ingredients);
    if (!diseaseCompatibility) {
      score -= 15;
    }

    // Factor 5: Recipe difficulty vs user experience (10 points)
    const difficultyScore = this.calculateDifficultyScore(recipe);
    score += difficultyScore * 10;

    // Factor 6: User interaction history (10 points)
    const historyScore = this.calculateHistoryScore(recipe);
    score += historyScore * 10;

    // Factor 7: Expiring ingredients priority (bonus 15 points)
    const expiringBonus = this.calculateExpiringIngredientsBonus(ingredients);
    score += expiringBonus * 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate how many required ingredients are available in fridge
   */
  calculateIngredientAvailability(recipeIngredients) {
    if (recipeIngredients.length === 0) return 0;

    const availableCount = recipeIngredients.filter(ingredient => {
      return this.fridgeInventory.some(item => {
        const productName = item.product_name?.toLowerCase() || '';
        const category = item.category?.toLowerCase() || '';
        const ingredientName = ingredient.toLowerCase();

        return (
          productName.includes(ingredientName) ||
          ingredientName.includes(productName) ||
          category.includes(ingredientName)
        );
      });
    }).length;

    return availableCount / recipeIngredients.length;
  }

  /**
   * Calculate preference match score
   */
  calculatePreferenceMatch(recipe, ingredients) {
    if (this.userPreferences.length === 0) return 0.5;

    let matchScore = 0;
    let totalWeight = 0;

    this.userPreferences.forEach(pref => {
      const prefItem = pref.food_item.toLowerCase();
      const recipeName = recipe.recipe_name?.toLowerCase() || '';
      const recipeIngredients = ingredients.join(' ').toLowerCase();

      const isPresent = recipeName.includes(prefItem) || recipeIngredients.includes(prefItem);

      if (isPresent) {
        const weight = pref.intensity / 10; // Normalize intensity
        totalWeight += weight;

        if (pref.preference_type === 'like') {
          matchScore += weight;
        } else if (pref.preference_type === 'dislike') {
          matchScore -= weight;
        }
      }
    });

    // Normalize to 0-1 range
    if (totalWeight === 0) return 0.5;
    return Math.max(0, Math.min(1, (matchScore + totalWeight) / (2 * totalWeight)));
  }

  /**
   * Check if recipe contains user allergens
   */
  containsAllergens(ingredients) {
    const ingredientsText = ingredients.join(' ').toLowerCase();

    return this.userAllergens.some(allergen => {
      const allergenName = allergen.allergen_name.toLowerCase();
      return ingredientsText.includes(allergenName);
    });
  }

  /**
   * Check if recipe is compatible with user's diseases
   */
  checkDiseaseCompatibility(recipe, ingredients) {
    if (this.userDiseases.length === 0) return true;

    const ingredientsText = ingredients.join(' ').toLowerCase();
    const recipeName = recipe.recipe_name?.toLowerCase() || '';

    // Check dietary restrictions for each disease
    for (const disease of this.userDiseases) {
      if (disease.dietary_restrictions) {
        const restrictions = disease.dietary_restrictions.toLowerCase().split(',');

        for (const restriction of restrictions) {
          const restrictionTerm = restriction.trim();
          if (
            ingredientsText.includes(restrictionTerm) ||
            recipeName.includes(restrictionTerm)
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Calculate difficulty score based on user experience
   */
  calculateDifficultyScore(recipe) {
    const difficulty = recipe.difficulty?.toLowerCase() || 'medium';

    // As user gains experience, prefer varied difficulties
    const difficultyMap = {
      easy: 0.7,
      medium: 1.0,
      hard: 0.5,
    };

    return difficultyMap[difficulty] || 0.7;
  }

  /**
   * Calculate score based on user interaction history
   */
  calculateHistoryScore(recipe) {
    // This would analyze past user interactions
    // For now, return neutral score
    return 0.5;
  }

  /**
   * Give bonus to recipes using expiring ingredients
   */
  calculateExpiringIngredientsBonus(ingredients) {
    const expiringItems = this.fridgeInventory.filter(item => {
      if (!item.expiry_date) return false;

      const daysUntilExpiry = this.getDaysUntilExpiry(item.expiry_date);
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
    });

    if (expiringItems.length === 0) return 0;

    const matchingExpiringCount = ingredients.filter(ingredient => {
      return expiringItems.some(item => {
        const productName = item.product_name?.toLowerCase() || '';
        return productName.includes(ingredient.toLowerCase());
      });
    }).length;

    return matchingExpiringCount / Math.max(1, ingredients.length);
  }

  /**
   * Generate human-readable recommendation reason
   */
  generateRecommendationReason(recipe) {
    const reasons = [];

    const ingredients = this.parseIngredients(recipe.ingredients);
    const availabilityScore = this.calculateIngredientAvailability(ingredients);

    if (availabilityScore > 0.7) {
      reasons.push('You have most ingredients');
    }

    const expiringBonus = this.calculateExpiringIngredientsBonus(ingredients);
    if (expiringBonus > 0) {
      reasons.push('Uses ingredients expiring soon');
    }

    const preferenceScore = this.calculatePreferenceMatch(recipe, ingredients);
    if (preferenceScore > 0.7) {
      reasons.push('Matches your taste preferences');
    }

    if (recipe.difficulty === 'easy') {
      reasons.push('Quick and easy to make');
    }

    return reasons.join(', ') || 'Good match for you';
  }

  /**
   * Parse ingredients from string to array
   */
  parseIngredients(ingredientsText) {
    if (!ingredientsText) return [];

    if (typeof ingredientsText === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(ingredientsText);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // If not JSON, split by common separators
        return ingredientsText
          .split(/[,;\n]/)
          .map(i => i.trim())
          .filter(i => i.length > 0);
      }
    }

    return [];
  }

  /**
   * Get list of available ingredients from fridge
   */
  getAvailableIngredients() {
    return this.fridgeInventory
      .filter(item => item.status === 'fresh')
      .map(item => item.product_name)
      .filter(name => name && name.length > 0);
  }

  /**
   * Calculate days until expiry
   */
  getDaysUntilExpiry(expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get food recommendations based on nutritional needs
   */
  async getNutritionalRecommendations(userId) {
    await this.initialize(userId);

    const recommendations = [];

    // Analyze current fridge inventory for nutritional gaps
    const nutritionalProfile = this.analyzeNutritionalProfile();

    // Suggest foods to fill nutritional gaps
    if (nutritionalProfile.protein < 30) {
      recommendations.push({
        category: 'protein',
        suggestion: 'Consider adding protein sources like chicken, fish, eggs, or legumes',
        priority: 'high',
      });
    }

    if (nutritionalProfile.vegetables < 20) {
      recommendations.push({
        category: 'vegetables',
        suggestion: 'Add more vegetables for vitamins and fiber',
        priority: 'medium',
      });
    }

    if (nutritionalProfile.fruits < 15) {
      recommendations.push({
        category: 'fruits',
        suggestion: 'Include fresh fruits for natural vitamins and antioxidants',
        priority: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Analyze nutritional profile of current fridge inventory
   */
  analyzeNutritionalProfile() {
    let totalItems = this.fridgeInventory.length;
    if (totalItems === 0) {
      return { protein: 0, vegetables: 0, fruits: 0, dairy: 0, grains: 0 };
    }

    const profile = {
      protein: 0,
      vegetables: 0,
      fruits: 0,
      dairy: 0,
      grains: 0,
    };

    this.fridgeInventory.forEach(item => {
      const category = item.category?.toLowerCase() || '';

      if (category.includes('meat') || category.includes('fish') || category.includes('egg')) {
        profile.protein++;
      }
      if (category.includes('vegetable')) {
        profile.vegetables++;
      }
      if (category.includes('fruit')) {
        profile.fruits++;
      }
      if (category.includes('dairy') || category.includes('milk') || category.includes('cheese')) {
        profile.dairy++;
      }
      if (category.includes('grain') || category.includes('bread') || category.includes('pasta')) {
        profile.grains++;
      }
    });

    // Convert to percentages
    Object.keys(profile).forEach(key => {
      profile[key] = (profile[key] / totalItems) * 100;
    });

    return profile;
  }
}

export default new RecommendationService();
