import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import DatabaseService from '../database/DatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class MLService {
  constructor() {
    this.model = null;
    this.isInitialized = false;
    this.userEmbedding = null;
    this.recipeEmbeddings = new Map();
  }

  /**
   * Initialize TensorFlow and load/create model
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize TensorFlow
      await tf.ready();
      console.log('TensorFlow.js initialized');

      // Try to load existing model
      await this.loadModel();

      // If no model exists, create a new one
      if (!this.model) {
        await this.createModel();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing ML service:', error);
    }
  }

  /**
   * Create a neural network model for recommendation
   */
  async createModel() {
    // Create a simple collaborative filtering model
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [50], // User + Recipe features
          units: 128,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid', // Output: recommendation probability
        }),
      ],
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    console.log('ML model created');
  }

  /**
   * Train model with user interaction data
   */
  async trainModel(userId) {
    try {
      await this.initialize();

      // Get user interactions from database
      const interactions = await DatabaseService.getUserInteractions(userId, 500);

      if (interactions.length < 10) {
        console.log('Not enough data to train model');
        return;
      }

      // Prepare training data
      const { features, labels } = await this.prepareTrainingData(interactions, userId);

      if (features.length === 0) {
        console.log('No valid training data');
        return;
      }

      // Convert to tensors
      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels, [labels.length, 1]);

      // Train the model
      await this.model.fit(xs, ys, {
        epochs: 20,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
          },
        },
      });

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      // Save the trained model
      await this.saveModel();

      console.log('Model training completed');
    } catch (error) {
      console.error('Error training model:', error);
    }
  }

  /**
   * Prepare training data from user interactions
   */
  async prepareTrainingData(interactions, userId) {
    const features = [];
    const labels = [];

    const userProfile = await DatabaseService.getUserProfile();
    const preferences = await DatabaseService.getFoodPreferences(userId);
    const allergens = await DatabaseService.getAllergens(userId);

    for (const interaction of interactions) {
      try {
        // Create feature vector
        const featureVector = await this.createFeatureVector(
          interaction,
          userProfile,
          preferences,
          allergens
        );

        if (featureVector) {
          features.push(featureVector);

          // Label: 1 for positive interactions, 0 for negative
          const label = this.getInteractionLabel(interaction);
          labels.push(label);
        }
      } catch (error) {
        console.error('Error creating feature vector:', error);
      }
    }

    return { features, labels };
  }

  /**
   * Create feature vector from interaction data
   */
  async createFeatureVector(interaction, userProfile, preferences, allergens) {
    // Feature vector components (50 features total):
    // - User features (10): age, preference scores, allergen count, etc.
    // - Recipe features (20): difficulty, cooking time, ingredient count, etc.
    // - Context features (20): time of day, day of week, season, etc.

    const features = new Array(50).fill(0);

    // User features (indices 0-9)
    features[0] = (userProfile?.age || 30) / 100; // Normalized age
    features[1] = preferences.filter(p => p.preference_type === 'like').length / 10;
    features[2] = preferences.filter(p => p.preference_type === 'dislike').length / 10;
    features[3] = allergens.length / 10;

    // Recipe features (indices 10-29)
    if (interaction.recipe_id) {
      const recipe = await DatabaseService.getRecipeById(interaction.recipe_id);
      if (recipe) {
        features[10] = this.encodeDifficulty(recipe.difficulty);
        features[11] = (recipe.cooking_time || 30) / 120; // Normalized cooking time
        features[12] = (recipe.rating || 50) / 100; // Normalized rating

        // Parse ingredients
        const ingredients = JSON.parse(recipe.ingredients || '[]');
        features[13] = ingredients.length / 20; // Normalized ingredient count
      }
    }

    // Context features (indices 30-49)
    const timestamp = new Date(interaction.timestamp);
    features[30] = timestamp.getHours() / 24; // Time of day
    features[31] = timestamp.getDay() / 7; // Day of week
    features[32] = timestamp.getMonth() / 12; // Month/Season

    // Interaction history features
    features[35] = this.encodeInteractionType(interaction.interaction_type);
    features[36] = this.encodeAction(interaction.action);

    return features;
  }

  /**
   * Get label from interaction (1 = positive, 0 = negative)
   */
  getInteractionLabel(interaction) {
    const positiveActions = ['viewed', 'saved', 'cooked', 'rated_high', 'shared'];
    const negativeActions = ['dismissed', 'rated_low', 'skipped'];

    if (positiveActions.includes(interaction.action)) {
      return 1;
    } else if (negativeActions.includes(interaction.action)) {
      return 0;
    }

    // Neutral action - consider context
    return 0.5;
  }

  /**
   * Encode difficulty as numerical value
   */
  encodeDifficulty(difficulty) {
    const difficultyMap = {
      easy: 0.2,
      medium: 0.5,
      hard: 0.8,
    };
    return difficultyMap[difficulty?.toLowerCase()] || 0.5;
  }

  /**
   * Encode interaction type
   */
  encodeInteractionType(type) {
    const typeMap = {
      recipe_view: 0.2,
      recipe_cook: 0.8,
      product_scan: 0.3,
      recommendation_view: 0.4,
    };
    return typeMap[type] || 0.5;
  }

  /**
   * Encode action type
   */
  encodeAction(action) {
    const actionMap = {
      viewed: 0.3,
      saved: 0.6,
      cooked: 0.9,
      dismissed: 0.1,
      rated_high: 0.8,
      rated_low: 0.2,
    };
    return actionMap[action] || 0.5;
  }

  /**
   * Predict recommendation score for a recipe
   */
  async predictScore(userId, recipe) {
    try {
      await this.initialize();

      if (!this.model) {
        console.log('Model not available, using rule-based scoring');
        return null;
      }

      const userProfile = await DatabaseService.getUserProfile();
      const preferences = await DatabaseService.getFoodPreferences(userId);
      const allergens = await DatabaseService.getAllergens(userId);

      // Create interaction-like object for feature extraction
      const pseudoInteraction = {
        recipe_id: recipe.id,
        interaction_type: 'recommendation_view',
        action: 'viewed',
        timestamp: new Date(),
      };

      const featureVector = await this.createFeatureVector(
        pseudoInteraction,
        userProfile,
        preferences,
        allergens
      );

      // Predict
      const inputTensor = tf.tensor2d([featureVector]);
      const prediction = this.model.predict(inputTensor);
      const score = (await prediction.data())[0];

      // Clean up
      inputTensor.dispose();
      prediction.dispose();

      return score * 100; // Return as percentage
    } catch (error) {
      console.error('Error predicting score:', error);
      return null;
    }
  }

  /**
   * Learn from user interaction
   */
  async learn(userId, interaction) {
    try {
      // Log interaction to database
      await DatabaseService.logInteraction(
        userId,
        interaction.type,
        interaction.action,
        interaction.productId,
        interaction.recipeId,
        JSON.stringify(interaction.context)
      );

      // Periodically retrain model (every 50 interactions)
      const interactions = await DatabaseService.getUserInteractions(userId, 1);
      const totalInteractions = interactions.length;

      if (totalInteractions % 50 === 0) {
        console.log('Triggering model retraining...');
        await this.trainModel(userId);
      }
    } catch (error) {
      console.error('Error learning from interaction:', error);
    }
  }

  /**
   * Get personalized recipe ranking
   */
  async rankRecipes(userId, recipes) {
    const rankedRecipes = [];

    for (const recipe of recipes) {
      const mlScore = await this.predictScore(userId, recipe);

      rankedRecipes.push({
        ...recipe,
        mlScore: mlScore || 50, // Default to neutral if prediction fails
      });
    }

    // Sort by ML score
    return rankedRecipes.sort((a, b) => b.mlScore - a.mlScore);
  }

  /**
   * Analyze user eating patterns
   */
  async analyzeEatingPatterns(userId) {
    const interactions = await DatabaseService.getUserInteractions(userId, 200);

    const patterns = {
      preferredCookingTimes: {},
      preferredDifficulty: {},
      preferredCuisines: {},
      cookingFrequency: {},
    };

    for (const interaction of interactions) {
      if (interaction.recipe_id && interaction.action === 'cooked') {
        const recipe = await DatabaseService.getRecipeById(interaction.recipe_id);

        if (recipe) {
          // Analyze cooking time preferences
          const timeRange = this.getTimeRange(recipe.cooking_time);
          patterns.preferredCookingTimes[timeRange] =
            (patterns.preferredCookingTimes[timeRange] || 0) + 1;

          // Analyze difficulty preferences
          patterns.preferredDifficulty[recipe.difficulty] =
            (patterns.preferredDifficulty[recipe.difficulty] || 0) + 1;

          // Analyze cuisine preferences
          if (recipe.cuisine_type) {
            patterns.preferredCuisines[recipe.cuisine_type] =
              (patterns.preferredCuisines[recipe.cuisine_type] || 0) + 1;
          }
        }

        // Analyze cooking frequency by day
        const timestamp = new Date(interaction.timestamp);
        const day = timestamp.toLocaleDateString('en-US', { weekday: 'long' });
        patterns.cookingFrequency[day] = (patterns.cookingFrequency[day] || 0) + 1;
      }
    }

    return patterns;
  }

  /**
   * Get time range for cooking time
   */
  getTimeRange(minutes) {
    if (minutes <= 20) return 'quick';
    if (minutes <= 45) return 'medium';
    return 'long';
  }

  /**
   * Save model to storage
   */
  async saveModel() {
    try {
      if (!this.model) return;

      const modelPath = 'localstorage://fridge-app-model';
      await this.model.save(modelPath);
      console.log('Model saved successfully');
    } catch (error) {
      console.error('Error saving model:', error);
    }
  }

  /**
   * Load model from storage
   */
  async loadModel() {
    try {
      const modelPath = 'localstorage://fridge-app-model';
      this.model = await tf.loadLayersModel(modelPath);
      console.log('Model loaded successfully');
    } catch (error) {
      console.log('No existing model found, will create new one');
      this.model = null;
    }
  }

  /**
   * Clear model and reset
   */
  async clearModel() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    await AsyncStorage.removeItem('tensorflowjs_models/fridge-app-model/info');
    this.isInitialized = false;
  }
}

export default new MLService();
