# Smart Fridge Scanner - Mobile Application

A comprehensive barcode scanning and fridge management application for iOS and Android.

## Overview

The Smart Fridge Scanner is an intelligent mobile application that helps you:
- **Scan products** using barcode technology
- **Manage your fridge** inventory with automatic expiry tracking
- **Get personalized recommendations** based on your preferences and available ingredients
- **Reduce food waste** with timely expiration notifications
- **Discover recipes** that match your dietary needs and available ingredients

## Key Features

### 🔍 Advanced Barcode Scanning
- Supports multiple barcode formats (EAN-13, UPC-A, EAN-8, QR codes)
- Real-time product information from OpenFoodFacts database
- Automatic nutritional data retrieval
- Manual barcode entry option

### 📱 Comprehensive Fridge Management
- Virtual fridge inventory with full product details
- Automatic expiry date calculation based on product category
- Status tracking (fresh, expiring soon, expired)
- Filter and search capabilities
- Product consumption tracking

### 👤 Personalized User Profiles
- Age-based recommendations
- Allergen tracking and warnings
- Food preference management (likes/dislikes)
- Health condition support with dietary restrictions
- Privacy-focused (all data stored locally)

### 🍳 Intelligent Recipe Recommendations
- AI-powered recipe matching
- Based on available ingredients in your fridge
- Considers allergens and dietary restrictions
- Integrates with Spoonacular API for 500,000+ recipes
- Difficulty and cooking time filters

### 🔔 Smart Notifications
- Expiry warnings (configurable threshold)
- Daily fridge check reminders
- Recipe suggestions
- Push notification support for iOS and Android

### 🤖 Machine Learning Integration
- Adaptive recommendation system
- Learns from your cooking behavior
- Pattern recognition for eating habits
- Personalized scoring algorithm
- Continuous improvement through user interactions

## Technology Stack

- **Framework**: React Native 0.72.6
- **Database**: SQLite (local storage)
- **ML**: TensorFlow.js for on-device machine learning
- **Navigation**: React Navigation 6
- **Camera**: React Native Vision Camera
- **APIs**:
  - OpenFoodFacts (product information)
  - Spoonacular (recipe database)

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Main app screens
│   │   ├── ScannerScreen.js      # Barcode scanning
│   │   ├── FridgeScreen.js       # Inventory management
│   │   ├── RecommendationsScreen.js  # Recipe recommendations
│   │   ├── ProfileScreen.js      # User profile
│   │   ├── OnboardingScreen.js   # First-time setup
│   │   ├── ProductDetailScreen.js
│   │   └── RecipeDetailScreen.js
│   ├── services/            # Business logic
│   │   ├── BarcodeService.js     # Product lookup
│   │   ├── RecipeService.js      # Recipe integration
│   │   ├── RecommendationService.js  # Recommendation engine
│   │   └── NotificationService.js    # Push notifications
│   ├── database/            # Data layer
│   │   └── DatabaseService.js    # SQLite operations
│   ├── ml/                  # Machine learning
│   │   └── MLService.js          # TensorFlow.js model
│   ├── config/              # Configuration
│   │   └── config.js             # App settings
│   └── assets/              # Images and fonts
├── android/                 # Android native code
├── ios/                     # iOS native code
├── App.js                   # Main app entry
├── package.json             # Dependencies
└── README.md                # This file
```

## Installation

### Prerequisites

- Node.js 16+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

### Quick Start

1. **Navigate to mobile app directory**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS pods** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Configure API keys**
   - Sign up at https://spoonacular.com/food-api
   - Edit `src/services/RecipeService.js`
   - Replace `YOUR_SPOONACULAR_API_KEY`

5. **Run the app**
   ```bash
   # Android
   npm run android

   # iOS
   npm run ios
   ```

For detailed setup instructions, see [SETUP_GUIDE.md](mobile-app/SETUP_GUIDE.md)

## Database Schema

The app uses a comprehensive SQLite schema:

- **user_profile** - User information and settings
- **allergens** - Tracked allergens with severity levels
- **food_preferences** - Likes/dislikes with intensity ratings
- **diseases** - Health conditions with dietary restrictions
- **products** - Product catalog with nutritional data
- **fridge_inventory** - Current fridge contents with expiry dates
- **recipes** - Recipe database with instructions
- **user_interactions** - ML training data
- **recommendations** - Generated recipe suggestions
- **notifications_history** - Notification audit log

## Machine Learning Features

### Recommendation Algorithm

The ML system uses a neural network with:
- **Input**: 50-dimensional feature vector (user preferences, recipe characteristics, context)
- **Architecture**: 4-layer feedforward network
- **Training**: Supervised learning from user interactions
- **Output**: Recommendation score (0-100%)

### Adaptive Learning

The system continuously learns from:
- Recipe views and dismissals
- Cooking confirmations
- Product scanning patterns
- Time-based preferences
- Ingredient usage

## API Integration

### OpenFoodFacts
- Free and open product database
- 2.3M+ products worldwide
- No API key required
- Real-time product information

### Spoonacular
- 500,000+ recipes
- Detailed nutritional information
- Ingredient-based search
- Dietary filters
- Free tier: 150 requests/day

## Notifications

The app sends smart notifications for:

1. **Expiry Warnings** (High Priority)
   - Products expiring today
   - Products expiring tomorrow
   - Products expiring in 3 days

2. **Recipe Recommendations** (Normal Priority)
   - Personalized suggestions
   - Using expiring ingredients
   - Based on cooking history

3. **Shopping Reminders** (Normal Priority)
   - Low inventory alerts
   - Frequently used items

## Privacy & Security

- **Local-first**: All data stored on device
- **No cloud sync**: Complete privacy
- **No tracking**: No analytics or user tracking
- **No account required**: Anonymous usage
- **Offline capable**: Core features work offline

## Performance Optimization

- **Lazy loading**: Images and data loaded on demand
- **Caching**: API responses cached locally
- **Database indexing**: Fast queries
- **Background processing**: ML training during idle time
- **Efficient rendering**: FlatList for long lists

## Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type checking (if using TypeScript)
npm run type-check
```

## Building for Production

### Android
```bash
cd android
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/`

### iOS
1. Open `ios/FridgeScannerApp.xcworkspace` in Xcode
2. Product → Archive
3. Distribute to App Store

## Troubleshooting

Common issues and solutions:

1. **Camera not working**
   - Check permissions in device settings
   - Verify Info.plist (iOS) or AndroidManifest.xml (Android)

2. **Database errors**
   - Clear app data and reinstall
   - Check SQLite version compatibility

3. **Build failures**
   - Clean build: `cd android && ./gradlew clean`
   - Clear Metro cache: `npm start -- --reset-cache`

4. **API issues**
   - Verify API keys are configured
   - Check network connectivity
   - Review API rate limits

## Roadmap

Future enhancements:

- [ ] Shopping list generation from fridge inventory
- [ ] Meal planning with calendar integration
- [ ] Barcode generation for custom products
- [ ] Recipe sharing with friends
- [ ] Multi-language support
- [ ] Voice commands
- [ ] Apple Watch / Wear OS companion app
- [ ] Cloud backup (optional)
- [ ] Grocery store integration
- [ ] Nutrition goal tracking

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

MIT License - see LICENSE file

## Support

- **Documentation**: See SETUP_GUIDE.md
- **Issues**: Open an issue on GitHub
- **Email**: support@fridgescanner.app

## Acknowledgments

- **OpenFoodFacts** for the comprehensive product database
- **Spoonacular** for the recipe API
- **React Native community** for the excellent framework
- **TensorFlow.js** for on-device machine learning

---

**Built with ❤️ using React Native**

For detailed setup instructions, see [SETUP_GUIDE.md](mobile-app/SETUP_GUIDE.md)
