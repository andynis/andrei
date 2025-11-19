/**
 * App Configuration
 *
 * Centralized configuration for the Smart Fridge Scanner app
 */

export const Config = {
  // API Configuration
  apis: {
    openFoodFacts: {
      baseUrl: 'https://world.openfoodfacts.org/api/v0',
      timeout: 10000,
    },
    spoonacular: {
      baseUrl: 'https://api.spoonacular.com',
      apiKey: process.env.SPOONACULAR_API_KEY || 'YOUR_SPOONACULAR_API_KEY',
      timeout: 15000,
    },
  },

  // Database Configuration
  database: {
    name: 'FridgeApp.db',
    version: '1.0',
    displayName: 'Fridge Scanner Database',
    size: 200000,
  },

  // Notification Configuration
  notifications: {
    expiryWarning: {
      enabled: true,
      daysThreshold: 3, // Warn X days before expiry
      dailyCheckTime: '09:00', // Time for daily check (24h format)
    },
    channels: {
      expiryWarnings: {
        id: 'expiry-warnings',
        name: 'Expiry Warnings',
        importance: 'high',
      },
      recommendations: {
        id: 'recommendations',
        name: 'Recipe Recommendations',
        importance: 'default',
      },
      shoppingReminders: {
        id: 'shopping-reminders',
        name: 'Shopping Reminders',
        importance: 'default',
      },
    },
  },

  // ML Configuration
  ml: {
    trainingThreshold: 50, // Retrain model after X interactions
    modelVersion: '1.0',
    featureVectorSize: 50,
    epochs: 20,
    batchSize: 32,
    validationSplit: 0.2,
    learningRate: 0.001,
  },

  // Recommendation Configuration
  recommendation: {
    maxRecommendations: 20,
    minScore: 30, // Minimum recommendation score (0-100)
    refreshInterval: 3600000, // Refresh recommendations every hour (ms)
  },

  // Barcode Scanner Configuration
  scanner: {
    supportedFormats: [
      'EAN_13',
      'EAN_8',
      'UPC_A',
      'UPC_E',
      'CODE_128',
      'QR_CODE',
    ],
    frameProcessorFps: 5,
    vibrationDuration: 100,
  },

  // Expiry Date Estimation (days)
  defaultShelfLife: {
    dairy: 7,
    meat: 3,
    fish: 2,
    vegetables: 7,
    fruits: 7,
    bread: 5,
    frozen: 90,
    canned: 365,
    beverages: 180,
    default: 30,
  },

  // App Settings
  app: {
    name: 'Smart Fridge Scanner',
    version: '1.0.0',
    supportEmail: 'support@fridgescanner.app',
    privacyPolicyUrl: 'https://fridgescanner.app/privacy',
    termsOfServiceUrl: 'https://fridgescanner.app/terms',
  },

  // Feature Flags
  features: {
    mlRecommendations: true,
    recipeSearch: true,
    nutritionTracking: true,
    shoppingList: false, // Future feature
    mealPlanning: false, // Future feature
    socialSharing: false, // Future feature
  },

  // Theme Configuration
  theme: {
    colors: {
      primary: '#4CAF50',
      secondary: '#2196F3',
      warning: '#FF9800',
      danger: '#F44336',
      success: '#4CAF50',
      info: '#2196F3',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#333333',
      textSecondary: '#666666',
      border: '#dddddd',
    },
    fonts: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
  },

  // Validation Rules
  validation: {
    minAge: 1,
    maxAge: 120,
    maxAllergens: 20,
    maxPreferences: 50,
    maxDiseases: 10,
  },
};

export default Config;
