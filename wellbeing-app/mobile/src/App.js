import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import CheckInScreen from './screens/CheckInScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import ThankYouScreen from './screens/ThankYouScreen';

const Stack = createStackNavigator();

const App = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRegistration();
  }, []);

  const checkRegistration = async () => {
    try {
      const appId = await AsyncStorage.getItem('appId');
      if (!appId) {
        // Generate unique app ID
        const newAppId = uuid.v4();
        await AsyncStorage.setItem('appId', newAppId);
      }

      const userInfo = await AsyncStorage.getItem('userInfo');
      setIsRegistered(!!userInfo);
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isRegistered ? 'Welcome' : 'Registration'}
        screenOptions={{
          headerStyle: {backgroundColor: '#4A90E2'},
          headerTintColor: '#fff',
          headerTitleStyle: {fontWeight: 'bold'},
        }}>
        <Stack.Screen
          name="Registration"
          component={RegistrationScreen}
          options={{title: 'Welcome'}}
        />
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{title: 'Well-being Check-in'}}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{title: 'Scan Classroom QR Code'}}
        />
        <Stack.Screen
          name="CheckIn"
          component={CheckInScreen}
          options={{title: 'How Are You Feeling?'}}
        />
        <Stack.Screen
          name="ThankYou"
          component={ThankYouScreen}
          options={{title: 'Thank You!', headerLeft: null}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
