# Smart Fridge Scanner App

A comprehensive mobile application for Android and iOS that helps you manage your fridge inventory with barcode scanning, personalized recommendations, and expiration tracking.

## Features

### 🔍 Barcode Scanning
- Scan any grocery product barcode
- Automatic product information retrieval
- Support for multiple barcode formats (EAN, UPC, etc.)

### 📦 Fridge Management
- Virtual fridge inventory
- Track all scanned products
- Automatic date tracking for each product
- Local SQLite database storage

### 👤 Personalized Profile
- Age and dietary preferences
- Allergen tracking
- Food likes and dislikes
- Health condition management (diseases)

### 🍳 Smart Recommendations
- Food suggestions based on fridge contents
- Personalized recommendations matching your preferences
- Recipe suggestions from top cooking books
- AI-powered adaptive learning

### ⏰ Expiration Warnings
- Push notifications for expiring products
- Configurable warning thresholds
- Never waste food again

### 🤖 Machine Learning
- Learns from your choices
- Adapts to your eating patterns
- Improves recommendations over time

## Installation

### Prerequisites
- Node.js 16+
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Setup

1. Install dependencies:
```bash
cd mobile-app
npm install
```

2. Install iOS pods (iOS only):
```bash
cd ios
pod install
cd ..
```

3. Run the app:

For Android:
```bash
npm run android
```

For iOS:
```bash
npm run ios
```

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # App screens
│   ├── database/            # SQLite database setup
│   ├── services/            # API and business logic
│   ├── ml/                  # Machine learning models
│   ├── utils/               # Helper functions
│   ├── navigation/          # Navigation configuration
│   └── assets/              # Images, icons, fonts
├── android/                 # Android native code
├── ios/                     # iOS native code
└── App.js                   # Main app entry point
```

## Key Technologies

- **React Native**: Cross-platform mobile development
- **SQLite**: Local database storage
- **TensorFlow.js**: Machine learning on-device
- **React Navigation**: Navigation system
- **OpenFoodFacts API**: Product information database
- **Spoonacular API**: Recipe database
- **Vision Camera**: Camera and barcode scanning

## Configuration

Configure API keys and settings in `src/config/config.js`

## License

MIT License
