import React, {useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

const ThankYouScreen = ({route, navigation}) => {
  const {score} = route.params || {score: 75};

  useEffect(() => {
    // Auto-navigate back to home after 5 seconds
    const timer = setTimeout(() => {
      navigation.navigate('Welcome');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const getEncouragementMessage = () => {
    if (score >= 80) {
      return {
        emoji: '🌟',
        message: "You're doing great!",
        submessage: 'Keep taking care of yourself!',
      };
    } else if (score >= 60) {
      return {
        emoji: '💛',
        message: 'Thank you for sharing!',
        submessage: 'Remember, it's okay to have ups and downs.',
      };
    } else {
      return {
        emoji: '🤗',
        message: 'We care about you!',
        submessage: 'Your teacher may check in with you today.',
      };
    }
  };

  const encouragement = getEncouragementMessage();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{encouragement.emoji}</Text>
        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.message}>{encouragement.message}</Text>
        <Text style={styles.submessage}>{encouragement.submessage}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your response has been recorded and your teacher has been notified.
          </Text>
        </View>

        <Text style={styles.reminder}>
          Remember: You can check in again in a few hours if you want to.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Welcome')}>
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  message: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 10,
    textAlign: 'center',
  },
  submessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#E8F4F8',
    padding: 20,
    borderRadius: 15,
    marginVertical: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 20,
  },
  reminder: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 18,
    margin: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ThankYouScreen;
