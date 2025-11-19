import axios from 'axios';
import DatabaseService from '../database/DatabaseService';

class RecipeService {
  constructor() {
    // Spoonacular API - You'll need to sign up for a free API key
    this.spoonacularAPI = 'https://api.spoonacular.com/recipes';
    this.apiKey = 'YOUR_SPOONACULAR_API_KEY'; // Replace with actual key

    // Recipe sources from popular cooking books/websites
    this.recipeSources = [
      {
        name: 'The Joy of Cooking',
        url: 'https://www.thejoykitchen.com',
        type: 'cookbook',
      },
      {
        name: 'Bon Appétit',
        url: 'https://www.bonappetit.com',
        type: 'magazine',
      },
      {
        name: 'Serious Eats',
        url: 'https://www.seriouseats.com',
        type: 'website',
      },
    ];
  }

  /**
   * Search recipes by available ingredients
   * @param {array} ingredients - List of available ingredients
   * @param {number} number - Number of recipes to return
   * @returns {array} List of recipes
   */
  async searchRecipesByIngredients(ingredients, number = 10) {
    try {
      const ingredientsList = ingredients.join(',');

      const response = await axios.get(
        `${this.spoonacularAPI}/findByIngredients`,
        {
          params: {
            apiKey: this.apiKey,
            ingredients: ingredientsList,
            number: number,
            ranking: 2, // Maximize used ingredients
            ignorePantry: false,
          },
        }
      );

      // Transform to our database format
      const recipes = await Promise.all(
        response.data.map(async recipe => {
          const details = await this.getRecipeDetails(recipe.id);
          return this.transformRecipeData(details);
        })
      );

      // Save to database
      for (const recipe of recipes) {
        await DatabaseService.addRecipe(recipe);
      }

      return recipes;
    } catch (error) {
      console.error('Error searching recipes:', error);
      return this.getFallbackRecipes(ingredients);
    }
  }

  /**
   * Get detailed recipe information
   * @param {number} recipeId - Spoonacular recipe ID
   * @returns {object} Recipe details
   */
  async getRecipeDetails(recipeId) {
    try {
      const response = await axios.get(
        `${this.spoonacularAPI}/${recipeId}/information`,
        {
          params: {
            apiKey: this.apiKey,
            includeNutrition: true,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      return null;
    }
  }

  /**
   * Search recipes by dietary restrictions
   * @param {object} restrictions - Dietary restrictions
   * @returns {array} Filtered recipes
   */
  async searchByDietaryRestrictions(restrictions) {
    try {
      const { diet, intolerances, cuisine, maxReadyTime } = restrictions;

      const response = await axios.get(
        `${this.spoonacularAPI}/complexSearch`,
        {
          params: {
            apiKey: this.apiKey,
            diet: diet, // vegetarian, vegan, gluten-free, etc.
            intolerances: intolerances?.join(','),
            cuisine: cuisine,
            maxReadyTime: maxReadyTime || 60,
            number: 20,
            addRecipeInformation: true,
            fillIngredients: true,
          },
        }
      );

      const recipes = response.data.results.map(recipe =>
        this.transformRecipeData(recipe)
      );

      // Save to database
      for (const recipe of recipes) {
        await DatabaseService.addRecipe(recipe);
      }

      return recipes;
    } catch (error) {
      console.error('Error searching by dietary restrictions:', error);
      return [];
    }
  }

  /**
   * Get random recipes for inspiration
   * @param {number} number - Number of recipes to fetch
   * @returns {array} Random recipes
   */
  async getRandomRecipes(number = 10) {
    try {
      const response = await axios.get(`${this.spoonacularAPI}/random`, {
        params: {
          apiKey: this.apiKey,
          number: number,
        },
      });

      const recipes = response.data.recipes.map(recipe =>
        this.transformRecipeData(recipe)
      );

      return recipes;
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      return this.getFallbackRecipes();
    }
  }

  /**
   * Search recipes by query
   * @param {string} query - Search query
   * @param {number} number - Number of results
   * @returns {array} Search results
   */
  async searchRecipes(query, number = 10) {
    try {
      const response = await axios.get(
        `${this.spoonacularAPI}/complexSearch`,
        {
          params: {
            apiKey: this.apiKey,
            query: query,
            number: number,
            addRecipeInformation: true,
            fillIngredients: true,
          },
        }
      );

      const recipes = response.data.results.map(recipe =>
        this.transformRecipeData(recipe)
      );

      return recipes;
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }

  /**
   * Transform API recipe data to our database format
   * @param {object} apiRecipe - Recipe from API
   * @returns {object} Transformed recipe
   */
  transformRecipeData(apiRecipe) {
    if (!apiRecipe) return null;

    return {
      recipe_name: apiRecipe.title,
      source: apiRecipe.sourceName || 'Spoonacular',
      ingredients: JSON.stringify(
        apiRecipe.extendedIngredients?.map(ing => ing.original) || []
      ),
      instructions: apiRecipe.instructions || this.formatInstructions(apiRecipe.analyzedInstructions),
      cooking_time: apiRecipe.readyInMinutes || 30,
      difficulty: this.calculateDifficulty(apiRecipe),
      cuisine_type: apiRecipe.cuisines?.join(', ') || 'International',
      image_url: apiRecipe.image || '',
      rating: apiRecipe.spoonacularScore || 0,
    };
  }

  /**
   * Format cooking instructions from API format
   */
  formatInstructions(analyzedInstructions) {
    if (!analyzedInstructions || analyzedInstructions.length === 0) {
      return '';
    }

    return analyzedInstructions
      .map(section =>
        section.steps
          .map(step => `${step.number}. ${step.step}`)
          .join('\n')
      )
      .join('\n\n');
  }

  /**
   * Calculate recipe difficulty based on various factors
   */
  calculateDifficulty(recipe) {
    const ingredientCount = recipe.extendedIngredients?.length || 0;
    const cookingTime = recipe.readyInMinutes || 0;
    const stepCount = recipe.analyzedInstructions?.[0]?.steps?.length || 0;

    if (ingredientCount <= 5 && cookingTime <= 30 && stepCount <= 5) {
      return 'easy';
    } else if (ingredientCount <= 10 && cookingTime <= 60 && stepCount <= 10) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  /**
   * Get fallback recipes when API is unavailable
   */
  getFallbackRecipes(ingredients = []) {
    // Basic recipes that can be stored locally
    const fallbackRecipes = [
      {
        recipe_name: 'Simple Pasta with Tomato Sauce',
        source: 'Built-in',
        ingredients: JSON.stringify(['pasta', 'tomato sauce', 'olive oil', 'garlic', 'basil']),
        instructions: '1. Boil pasta according to package directions\n2. Heat olive oil and sauté garlic\n3. Add tomato sauce and simmer\n4. Mix with cooked pasta\n5. Garnish with fresh basil',
        cooking_time: 20,
        difficulty: 'easy',
        cuisine_type: 'Italian',
        image_url: '',
        rating: 75,
      },
      {
        recipe_name: 'Scrambled Eggs',
        source: 'Built-in',
        ingredients: JSON.stringify(['eggs', 'butter', 'salt', 'pepper', 'milk']),
        instructions: '1. Beat eggs with milk, salt, and pepper\n2. Melt butter in pan\n3. Pour egg mixture and cook slowly\n4. Stir gently until set',
        cooking_time: 10,
        difficulty: 'easy',
        cuisine_type: 'American',
        image_url: '',
        rating: 70,
      },
      {
        recipe_name: 'Grilled Chicken Salad',
        source: 'Built-in',
        ingredients: JSON.stringify(['chicken breast', 'lettuce', 'tomatoes', 'cucumber', 'olive oil', 'lemon']),
        instructions: '1. Season and grill chicken breast\n2. Chop vegetables\n3. Slice grilled chicken\n4. Toss with olive oil and lemon\n5. Serve fresh',
        cooking_time: 25,
        difficulty: 'easy',
        cuisine_type: 'Mediterranean',
        image_url: '',
        rating: 80,
      },
    ];

    return fallbackRecipes;
  }

  /**
   * Get meal plan suggestions for the week
   * @param {number} userId - User ID
   * @returns {array} Weekly meal plan
   */
  async generateWeeklyMealPlan(userId) {
    try {
      // Get user preferences and fridge inventory
      const userProfile = await DatabaseService.getUserProfile();
      const fridgeItems = await DatabaseService.getFridgeInventory();

      const response = await axios.get(`${this.spoonacularAPI}/mealplans/generate`, {
        params: {
          apiKey: this.apiKey,
          timeFrame: 'week',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      return null;
    }
  }

  /**
   * Parse recipe from cookbook content
   * This is a simplified version - real implementation would use OCR/text parsing
   */
  async parseRecipeFromCookbook(cookbookText) {
    // This would typically use NLP to extract recipe components
    // For now, returning a basic structure
    return {
      recipe_name: 'Parsed Recipe',
      source: 'Cookbook',
      ingredients: JSON.stringify([]),
      instructions: cookbookText,
      cooking_time: 30,
      difficulty: 'medium',
      cuisine_type: 'Various',
      image_url: '',
    };
  }

  /**
   * Get nutritional information for a recipe
   */
  async getNutritionalInfo(recipeId) {
    try {
      const response = await axios.get(
        `${this.spoonacularAPI}/${recipeId}/nutritionWidget.json`,
        {
          params: {
            apiKey: this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching nutritional info:', error);
      return null;
    }
  }
}

export default new RecipeService();
