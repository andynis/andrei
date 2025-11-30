import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegistrationScreen = ({navigation}) => {
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [parentalConsent, setParentalConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const handleRegistration = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!age || parseInt(age) < 5 || parseInt(age) > 18) {
      Alert.alert('Error', 'Please enter a valid age (5-18)');
      return;
    }

    if (!parentalConsent) {
      Alert.alert('Error', 'Parental consent is required');
      return;
    }

    if (!privacyConsent) {
      Alert.alert('Error', 'Privacy policy consent is required');
      return;
    }

    try {
      const appId = await AsyncStorage.getItem('appId');
      const userInfo = {
        firstName,
        age: parseInt(age),
        registeredAt: new Date().toISOString(),
        parentalConsent: true,
        privacyConsent: true,
      };

      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));

      // Register with backend
      // This will be implemented when backend is ready

      Alert.alert('Success', 'Registration complete!', [
        {text: 'OK', onPress: () => navigation.replace('Welcome')},
      ]);
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>
          Let's set up your well-being check-in app
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>What's your first name?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How old are you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <View style={styles.consentGroup}>
          <View style={styles.consentItem}>
            <Switch
              value={parentalConsent}
              onValueChange={setParentalConsent}
              trackColor={{false: '#ccc', true: '#4A90E2'}}
            />
            <Text style={styles.consentText}>
              My parent/guardian has given permission to use this app
            </Text>
          </View>

          <View style={styles.consentItem}>
            <Switch
              value={privacyConsent}
              onValueChange={setPrivacyConsent}
              trackColor={{false: '#ccc', true: '#4A90E2'}}
            />
            <Text style={styles.consentText}>
              I understand how my data will be used (Privacy Policy)
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegistration}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          This app helps your teachers understand how you're feeling so they can
          support you better. Your responses are private and confidential.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  consentGroup: {
    marginTop: 10,
    marginBottom: 20,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  consentText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#2C3E50',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default RegistrationScreen;
