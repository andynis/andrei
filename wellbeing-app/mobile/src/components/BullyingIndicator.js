import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import AccessibilityService from '../services/AccessibilityService';

// Age-appropriate bullying indicator questions
const questionsByAge = {
  '5-7': [
    {
      id: 'friends',
      question: 'Do you have friends to play with?',
      options: [
        {label: 'Yes, always 😊', value: 3, points: 0},
        {label: 'Yes, sometimes 🙂', value: 2, points: 0},
        {label: 'Not really 😐', value: 1, points: 2},
        {label: 'No, never 😢', value: 0, points: 2},
      ],
    },
    {
      id: 'school_enjoyment',
      question: 'Do you want to come to school?',
      options: [
        {label: 'Yes, I love it! 😄', value: 3, points: 0},
        {label: "Yes, it's okay 🙂", value: 2, points: 0},
        {label: 'Not really 😐', value: 1, points: 2},
        {label: "No, I don't want to 😞", value: 0, points: 2},
      ],
    },
    {
      id: 'join_activities',
      question: 'Do other kids let you join in games?',
      options: [
        {label: 'Yes, always ✓', value: 3, points: 0},
        {label: 'Yes, most of the time', value: 2, points: 0},
        {label: 'Sometimes', value: 1, points: 2},
        {label: 'Rarely or never', value: 0, points: 2},
      ],
    },
    {
      id: 'sleep_appetite',
      question: 'Do you sleep well and eat well?',
      options: [
        {label: 'Yes, both good ✓', value: 2, points: 0},
        {label: 'One is not good', value: 1, points: 1},
        {label: 'Both are not good', value: 0, points: 2},
      ],
    },
  ],
  '8-12': [
    {
      id: 'friends',
      question: 'Do you have friends to hang out with?',
      options: [
        {label: 'Yes, always 😊', value: 3, points: 0},
        {label: 'Yes, sometimes 🙂', value: 2, points: 0},
        {label: 'Not really 😐', value: 1, points: 2},
        {label: 'No, never 😢', value: 0, points: 2},
      ],
    },
    {
      id: 'school_enjoyment',
      question: 'Do you want to come to school?',
      options: [
        {label: 'Yes, I love it! 😄', value: 3, points: 0},
        {label: "Yes, it's okay 🙂", value: 2, points: 0},
        {label: 'Not really 😐', value: 1, points: 2},
        {label: "No, I don't want to 😞", value: 0, points: 2},
      ],
    },
    {
      id: 'safety',
      question: 'Do you feel safe at school?',
      options: [
        {label: 'Always safe ✓', value: 3, points: 0},
        {label: 'Usually safe', value: 2, points: 0},
        {label: 'Sometimes unsafe', value: 1, points: 3},
        {label: 'Often unsafe', value: 0, points: 3},
      ],
    },
    {
      id: 'join_activities',
      question: 'Do other kids let you join in activities?',
      options: [
        {label: 'Yes, always', value: 3, points: 0},
        {label: 'Yes, most of the time', value: 2, points: 0},
        {label: 'Sometimes', value: 1, points: 2},
        {label: 'Rarely or never', value: 0, points: 2},
      ],
    },
    {
      id: 'avoid_places',
      question: 'Are there places in school you try to avoid?',
      options: [
        {label: 'No, I go everywhere', value: 3, points: 0},
        {label: 'Maybe one or two places', value: 2, points: 1},
        {label: 'Yes, several places', value: 1, points: 3},
        {label: 'Yes, many places', value: 0, points: 3},
      ],
    },
    {
      id: 'sleep_appetite',
      question: 'Do you sleep well and eat well?',
      options: [
        {label: 'Yes, both good ✓', value: 2, points: 0},
        {label: 'One is not good', value: 1, points: 1},
        {label: 'Both are not good', value: 0, points: 2},
      ],
    },
    {
      id: 'looking_forward',
      question: 'Do you look forward to tomorrow at school?',
      options: [
        {label: 'Yes, I do! 😊', value: 3, points: 0},
        {label: 'I guess so 😐', value: 2, points: 0},
        {label: 'Not really 😟', value: 1, points: 2},
        {label: "No, I don't 😢", value: 0, points: 2},
      ],
    },
  ],
  '13-18': [
    {
      id: 'friends',
      question: 'Do you have friends at school?',
      options: [
        {label: 'Yes, always', value: 3, points: 0},
        {label: 'Yes, sometimes', value: 2, points: 0},
        {label: 'Not really', value: 1, points: 2},
        {label: 'No, never', value: 0, points: 2},
      ],
    },
    {
      id: 'school_enjoyment',
      question: 'Do you want to come to school?',
      options: [
        {label: 'Yes, I enjoy it', value: 3, points: 0},
        {label: "It's okay", value: 2, points: 0},
        {label: 'Not really', value: 1, points: 2},
        {label: 'No, I dread it', value: 0, points: 2},
      ],
    },
    {
      id: 'safety',
      question: 'Do you feel safe at school?',
      options: [
        {label: 'Always safe', value: 3, points: 0},
        {label: 'Usually safe', value: 2, points: 0},
        {label: 'Sometimes unsafe', value: 1, points: 3},
        {label: 'Often unsafe', value: 0, points: 3},
      ],
    },
    {
      id: 'join_activities',
      question: 'Are you included in group activities?',
      options: [
        {label: 'Yes, always', value: 3, points: 0},
        {label: 'Yes, most of the time', value: 2, points: 0},
        {label: 'Sometimes', value: 1, points: 2},
        {label: 'Rarely or never', value: 0, points: 2},
      ],
    },
    {
      id: 'avoid_places',
      question: 'Are there places at school you avoid?',
      options: [
        {label: 'No, I go everywhere', value: 3, points: 0},
        {label: 'One or two places', value: 2, points: 1},
        {label: 'Several places', value: 1, points: 3},
        {label: 'Many places', value: 0, points: 3},
      ],
    },
    {
      id: 'belongings',
      question: 'Have your belongings been taken or damaged?',
      options: [
        {label: 'No, never', value: 3, points: 0},
        {label: 'Once or twice', value: 2, points: 1},
        {label: 'Yes, sometimes', value: 1, points: 2},
        {label: 'Yes, often', value: 0, points: 2},
      ],
    },
    {
      id: 'sleep_appetite',
      question: 'How are your sleep and appetite?',
      options: [
        {label: 'Both good', value: 2, points: 0},
        {label: 'One is affected', value: 1, points: 1},
        {label: 'Both are affected', value: 0, points: 2},
      ],
    },
    {
      id: 'looking_forward',
      question: 'Do you look forward to coming to school?',
      options: [
        {label: 'Yes, I do', value: 3, points: 0},
        {label: 'Sometimes', value: 2, points: 0},
        {label: 'Not really', value: 1, points: 2},
        {label: 'No, I dread it', value: 0, points: 2},
      ],
    },
  ],
};

const BullyingIndicator = ({age, value = {}, onChange}) => {
  // Determine age group
  const getAgeGroup = age => {
    if (age <= 7) return '5-7';
    if (age <= 12) return '8-12';
    return '13-18';
  };

  const ageGroup = getAgeGroup(age);
  const questions = questionsByAge[ageGroup];

  useEffect(() => {
    // Read the section introduction
    AccessibilityService.speak(
      'Now some questions about how you feel at school. Please answer honestly.'
    );
  }, []);

  const handleSelection = (questionId, option) => {
    const newValue = {
      ...value,
      [questionId]: {
        value: option.value,
        points: option.points,
        label: option.label,
      },
    };
    onChange(newValue);

    // Accessibility feedback
    AccessibilityService.announceSelection('Answer', option.label);
  };

  const calculateBullyingLevel = () => {
    let totalPoints = 0;
    Object.values(value).forEach(answer => {
      totalPoints += answer.points || 0;
    });
    return totalPoints;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>🤝 School Experience</Text>
      <Text style={styles.sectionDescription}>
        Help us understand how you feel at school
      </Text>

      {questions.map((question, index) => (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionNumber}>Question {index + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  value[question.id]?.value === option.value &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelection(question.id, option)}
                {...AccessibilityService.getAccessibilityProps(
                  option.label,
                  `Select ${option.label} for ${question.question}`,
                  'radio'
                )}>
                <Text
                  style={[
                    styles.optionText,
                    value[question.id]?.value === option.value &&
                      styles.optionTextSelected,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
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
    marginBottom: 20,
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#F5F7FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    minHeight: 56, // Large touch target for accessibility
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: '#3498DB',
    backgroundColor: '#EBF5FB',
  },
  optionText: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#3498DB',
    fontWeight: '600',
  },
});

export default BullyingIndicator;
