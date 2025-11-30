import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WelcomeScreen = ({navigation}) => {
  const [firstName, setFirstName] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        setFirstName(parsed.firstName);
      }

      const lastCheck = await AsyncStorage.getItem('lastCheckIn');
      if (lastCheck) {
        setLastCheckIn(new Date(lastCheck));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleStartCheckIn = () => {
    navigation.navigate('QRScanner');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const canCheckIn = () => {
    if (!lastCheckIn) return true;
    const now = new Date();
    const hoursSinceLastCheck =
      (now - lastCheckIn) / (1000 * 60 * 60);
    return hoursSinceLastCheck >= 2; // Can check in every 2 hours
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {getGreeting()}, {firstName}! 👋
        </Text>
        <Text style={styles.subtitle}>How are you feeling today?</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🌟</Text>
        <Text style={styles.message}>
          Your well-being matters! Take a moment to check in with yourself.
        </Text>

        {lastCheckIn && (
          <View style={styles.lastCheckInBox}>
            <Text style={styles.lastCheckInLabel}>Last check-in:</Text>
            <Text style={styles.lastCheckInTime}>
              {lastCheckIn.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            !canCheckIn() && styles.buttonDisabled,
          ]}
          onPress={handleStartCheckIn}
          disabled={!canCheckIn()}>
          <Text style={styles.buttonText}>
            {canCheckIn() ? 'Start Check-in' : 'Check-in Again Later'}
          </Text>
        </TouchableOpacity>

        {!canCheckIn() && (
          <Text style={styles.waitMessage}>
            Please wait at least 2 hours between check-ins
          </Text>
        )}

        <Text style={styles.note}>
          This will take less than 1 minute ⏱️
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 30,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F4F8',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  lastCheckInBox: {
    backgroundColor: '#E8F4F8',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  lastCheckInLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  lastCheckInTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitMessage: {
    marginTop: 10,
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
  },
  note: {
    marginTop: 15,
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
