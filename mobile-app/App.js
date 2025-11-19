import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import ScannerScreen from './src/screens/ScannerScreen';
import FridgeScreen from './src/screens/FridgeScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';

// Services
import DatabaseService from './src/database/DatabaseService';
import NotificationService from './src/services/NotificationService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Scanner') {
            iconName = 'barcode-scan';
          } else if (route.name === 'Fridge') {
            iconName = 'fridge';
          } else if (route.name === 'Recipes') {
            iconName = 'food';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Fridge"
        component={FridgeScreen}
        options={{ title: 'My Fridge' }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ title: 'Scan Product' }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecommendationsScreen}
        options={{ title: 'Recommendations' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Root stack navigator
function App() {
  const [isFirstLaunch, setIsFirstLaunch] = React.useState(null);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Initialize database
        await DatabaseService.initDB();
        console.log('Database initialized');

        // Check if user profile exists
        const userProfile = await DatabaseService.getUserProfile();
        setIsFirstLaunch(userProfile === null);

        // Initialize notifications
        NotificationService.configure();
        await NotificationService.requestPermissions();

        // Schedule daily expiry checks
        NotificationService.scheduleDailyExpiryCheck();

        // Check for expiring products immediately
        await NotificationService.checkExpiringProducts();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  if (isFirstLaunch === null) {
    return null; // Show loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isFirstLaunch ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        ) : null}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: 'Product Details' }}
        />
        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
          options={{ title: 'Recipe Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
