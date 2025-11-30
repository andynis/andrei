import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmojiScale from '../components/EmojiScale';
import ColorScale from '../components/ColorScale';
import SymptomSelector from '../components/SymptomSelector';
import ApiService from '../services/ApiService';

const CheckInScreen = ({route, navigation}) => {
  const {classroomId, schoolId} = route.params;

  // Emotional well-being
  const [mood, setMood] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(null);
  const [socialComfort, setSocialComfort] = useState(null);

  // Physical health
  const [symptoms, setSymptoms] = useState([]);
  const [feelingOkay, setFeelingOkay] = useState(null);

  // Optional inputs
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const calculateWellbeingScore = () => {
    let score = 0;
    let maxScore = 0;

    // Mood (0-5 scale, weight: 30%)
    if (mood !== null) {
      score += (mood / 5) * 30;
    }
    maxScore += 30;

    // Energy level (0-5 scale, weight: 20%)
    if (energyLevel !== null) {
      score += (energyLevel / 5) * 20;
    }
    maxScore += 20;

    // Social comfort (0-5 scale, weight: 20%)
    if (socialComfort !== null) {
      score += (socialComfort / 5) * 20;
    }
    maxScore += 20;

    // Physical health (weight: 30%)
    // Subtract points for each symptom
    const symptomPenalty = Math.min(symptoms.length * 5, 30);
    score += 30 - symptomPenalty;
    maxScore += 30;

    return Math.round((score / maxScore) * 100);
  };

  const isFormComplete = () => {
    return mood !== null && energyLevel !== null && socialComfort !== null && feelingOkay !== null;
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      Alert.alert('Incomplete', 'Please answer all required questions.');
      return;
    }

    setSubmitting(true);

    try {
      const appId = await AsyncStorage.getItem('appId');
      const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'));

      const wellbeingScore = calculateWellbeingScore();

      const checkInData = {
        appId,
        classroomId,
        schoolId,
        timestamp: new Date().toISOString(),
        mood,
        energyLevel,
        socialComfort,
        symptoms,
        feelingOkay,
        additionalNotes: additionalNotes.trim(),
        wellbeingScore,
        studentAge: userInfo.age,
      };

      // Submit to backend
      await ApiService.submitCheckIn(checkInData);

      // Store last check-in time
      await AsyncStorage.setItem('lastCheckIn', new Date().toISOString());

      navigation.navigate('ThankYou', {score: wellbeingScore});
    } catch (error) {
      console.error('Check-in submission error:', error);
      Alert.alert('Error', 'Could not submit check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>😊 How are you feeling?</Text>
        <Text style={styles.sectionDescription}>
          Choose the emoji that best matches your mood
        </Text>
        <EmojiScale value={mood} onChange={setMood} />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>⚡ Energy Level</Text>
        <Text style={styles.sectionDescription}>
          How much energy do you have right now?
        </Text>
        <ColorScale
          value={energyLevel}
          onChange={setEnergyLevel}
          colors={['#E74C3C', '#F39C12', '#F1C40F', '#2ECC71', '#27AE60']}
          labels={['Very tired', 'Tired', 'Okay', 'Good', 'Full of energy']}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>👥 Social Comfort</Text>
        <Text style={styles.sectionDescription}>
          How comfortable do you feel around others today?
        </Text>
        <ColorScale
          value={socialComfort}
          onChange={setSocialComfort}
          colors={['#E74C3C', '#F39C12', '#F1C40F', '#2ECC71', '#27AE60']}
          labels={['Very uncomfortable', 'Uncomfortable', 'Okay', 'Comfortable', 'Very comfortable']}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>🏥 Physical Health</Text>
        <Text style={styles.sectionDescription}>
          Do you feel okay today?
        </Text>
        <View style={styles.yesNoContainer}>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              feelingOkay === true && styles.yesNoButtonSelected,
            ]}
            onPress={() => setFeelingOkay(true)}>
            <Text
              style={[
                styles.yesNoText,
                feelingOkay === true && styles.yesNoTextSelected,
              ]}>
              Yes ✓
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              feelingOkay === false && styles.yesNoButtonSelected,
            ]}
            onPress={() => setFeelingOkay(false)}>
            <Text
              style={[
                styles.yesNoText,
                feelingOkay === false && styles.yesNoTextSelected,
              ]}>
              No ✗
            </Text>
          </TouchableOpacity>
        </View>

        {feelingOkay === false && (
          <>
            <Text style={styles.subsectionTitle}>
              What symptoms are you experiencing?
            </Text>
            <SymptomSelector value={symptoms} onChange={setSymptoms} />
          </>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>💭 Anything else? (Optional)</Text>
        <Text style={styles.sectionDescription}>
          Share anything else you'd like your teacher to know
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder="I feel... (optional)"
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormComplete() || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormComplete() || submitting}>
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Check-in'}
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 15,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 15,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 25,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  yesNoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E8F4F8',
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  yesNoTextSelected: {
    color: '#4A90E2',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckInScreen;
