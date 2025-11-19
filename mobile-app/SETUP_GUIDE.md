# Smart Fridge Scanner - Complete Setup Guide

This guide will help you set up and run the Smart Fridge Scanner mobile application on both Android and iOS platforms.

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

3. **Watchman** (for macOS users)
   ```bash
   brew install watchman
   ```

### For Android Development

1. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API Level 31 or higher)
   - Set up Android Virtual Device (AVD)

2. **Environment Variables**
   Add to your `~/.bash_profile` or `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### For iOS Development (macOS only)

1. **Xcode** (latest version)
   - Download from Mac App Store
   - Install Command Line Tools:
     ```bash
     xcode-select --install
     ```

2. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

## Installation Steps

### 1. Clone and Navigate

```bash
cd mobile-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install iOS Pods (iOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Configure API Keys

The app uses external APIs for enhanced functionality. You'll need to sign up for free API keys:

#### a) Spoonacular API (for recipes)

1. Sign up at: https://spoonacular.com/food-api
2. Get your free API key (150 requests/day on free tier)
3. Open `src/services/RecipeService.js`
4. Replace `YOUR_SPOONACULAR_API_KEY` with your actual API key

```javascript
this.apiKey = 'your_actual_api_key_here';
```

#### b) OpenFoodFacts (No API key needed)

OpenFoodFacts is a free and open database. No configuration needed!

### 5. Configure Permissions

#### Android Permissions

Permissions are already configured in the template. The app requires:
- Camera (for barcode scanning)
- Storage (for database)
- Notifications (for expiry alerts)

Create/verify `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

#### iOS Permissions

Add to `ios/FridgeScannerApp/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan product barcodes</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to save product images</string>
```

## Running the App

### Android

1. **Start Metro Bundler**
   ```bash
   npm start
   ```

2. **In a new terminal, run Android**
   ```bash
   npm run android
   ```

   Or with specific device:
   ```bash
   npx react-native run-android --deviceId=<device_id>
   ```

### iOS

1. **Start Metro Bundler**
   ```bash
   npm start
   ```

2. **In a new terminal, run iOS**
   ```bash
   npm run ios
   ```

   Or with specific simulator:
   ```bash
   npx react-native run-ios --simulator="iPhone 14 Pro"
   ```

## Troubleshooting

### Common Issues

#### 1. "Unable to resolve module"

Clear cache and reinstall:
```bash
npm start -- --reset-cache
rm -rf node_modules
npm install
```

#### 2. Android Build Errors

Clean and rebuild:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

#### 3. iOS Build Errors

Clean build folder and reinstall pods:
```bash
cd ios
rm -rf build
pod deintegrate
pod install
cd ..
npm run ios
```

#### 4. Camera Not Working

- **Android**: Verify camera permission in Settings
- **iOS**: Check Info.plist has camera usage description
- **Both**: Test on real device (camera doesn't work in some emulators)

#### 5. Database Errors

The app uses SQLite. If you encounter database errors:
```bash
# Clear app data on Android
adb shell pm clear com.fridgescannerapp

# Or reinstall the app
```

#### 6. "Command PhaseScriptExecution failed" (iOS)

```bash
cd ios
pod deintegrate
pod cache clean --all
pod install
cd ..
```

## Testing the App

### 1. First Launch

- Complete the onboarding process
- Add your age, allergens, preferences
- Grant camera permissions

### 2. Scan Products

- Tap "Scanner" tab
- Point camera at a barcode
- Wait for automatic detection
- Product will be added to your fridge

### 3. View Fridge

- Tap "Fridge" tab
- See all scanned products
- Filter by status (fresh, expiring, expired)
- Tap product for details

### 4. Get Recommendations

- Tap "Recipes" tab
- View personalized recipe suggestions
- Tap recipe for full details
- Mark recipes as cooked to improve recommendations

### 5. Manage Profile

- Tap "Profile" tab
- View your statistics
- Manage allergens and preferences
- Configure notifications

## Building for Production

### Android APK

```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### iOS IPA

1. Open Xcode
2. Select your project
3. Product → Archive
4. Distribute App → App Store Connect

## Features Overview

### ✅ Implemented Features

1. **Barcode Scanning**
   - Multi-format support (EAN, UPC, QR)
   - Automatic product information retrieval
   - Manual barcode entry

2. **Fridge Management**
   - Track all scanned products
   - Automatic expiry date calculation
   - Status monitoring (fresh, expiring, expired)
   - Filter and search

3. **User Profiles**
   - Age tracking
   - Allergen management
   - Food preferences (likes/dislikes)
   - Health conditions

4. **Smart Recommendations**
   - Recipe suggestions based on fridge contents
   - Personalized matching
   - Allergen-safe filtering
   - ML-powered scoring

5. **Notifications**
   - Expiry warnings
   - Daily fridge checks
   - Recipe suggestions

6. **Machine Learning**
   - Adaptive recommendations
   - User behavior tracking
   - Pattern recognition
   - Continuous learning

## API Usage & Limits

### Free Tier Limits

- **OpenFoodFacts**: Unlimited (open database)
- **Spoonacular**: 150 requests/day (free tier)

### Upgrade Options

For production use, consider:
- **Spoonacular Premium**: 500+ requests/day ($50/month)
- Or implement caching to reduce API calls

## Database Schema

The app uses SQLite with these main tables:

- `user_profile` - User information
- `allergens` - User allergens
- `food_preferences` - Likes/dislikes
- `diseases` - Health conditions
- `products` - Product catalog
- `fridge_inventory` - Virtual fridge
- `recipes` - Recipe database
- `user_interactions` - ML training data
- `recommendations` - Generated recommendations
- `notifications_history` - Notification log

## Privacy & Data

- All data stored locally on device
- No server required
- No data collection
- Offline-first design

## Support

### Getting Help

1. Check this guide
2. Review error logs: `npx react-native log-android` or `npx react-native log-ios`
3. Check React Native documentation: https://reactnative.dev/
4. Check issues in the repository

### Reporting Bugs

When reporting issues, include:
- Device/emulator details
- OS version
- Error messages
- Steps to reproduce

## Next Steps

After setup:

1. Test barcode scanning with real products
2. Build your fridge inventory
3. Try the recommendation system
4. Customize your profile
5. Explore the ML features

## Performance Tips

1. **Optimize Images**: Keep product images under 500KB
2. **Database Cleanup**: Periodically remove consumed items
3. **Cache Recipes**: Reduce API calls by caching popular recipes
4. **ML Training**: Train model during idle times

## Future Enhancements

Potential features to add:

- Shopping list generation
- Meal planning
- Calorie tracking
- Recipe sharing
- Multi-language support
- Barcode generation
- Export data functionality

## License

See LICENSE file in the repository.

---

**Happy Scanning!** 🎉

For questions or issues, please refer to the main README.md or open an issue in the repository.
