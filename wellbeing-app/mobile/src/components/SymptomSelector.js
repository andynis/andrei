import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const symptoms = [
  {id: 'headache', label: '🤕 Headache', icon: '🤕'},
  {id: 'stomachache', label: '🤢 Stomach ache', icon: '🤢'},
  {id: 'fatigue', label: '😴 Very tired', icon: '😴'},
  {id: 'cold', label: '🤧 Cold/Cough', icon: '🤧'},
  {id: 'sore_throat', label: '😷 Sore throat', icon: '😷'},
  {id: 'dizzy', label: '😵 Dizzy', icon: '😵'},
  {id: 'pain', label: '😣 Body pain', icon: '😣'},
  {id: 'other', label: '🩹 Other', icon: '🩹'},
];

const SymptomSelector = ({value, onChange}) => {
  const toggleSymptom = symptomId => {
    if (value.includes(symptomId)) {
      onChange(value.filter(id => id !== symptomId));
    } else {
      onChange([...value, symptomId]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.symptomGrid}>
        {symptoms.map(symptom => (
          <TouchableOpacity
            key={symptom.id}
            style={[
              styles.symptomButton,
              value.includes(symptom.id) && styles.symptomButtonSelected,
            ]}
            onPress={() => toggleSymptom(symptom.id)}>
            <Text style={styles.symptomIcon}>{symptom.icon}</Text>
            <Text
              style={[
                styles.symptomText,
                value.includes(symptom.id) && styles.symptomTextSelected,
              ]}>
              {symptom.label.replace(/.*\s/, '')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  symptomButton: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  symptomButtonSelected: {
    borderColor: '#E74C3C',
    backgroundColor: '#FADBD8',
  },
  symptomIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  symptomText: {
    fontSize: 11,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  symptomTextSelected: {
    color: '#E74C3C',
    fontWeight: '600',
  },
});

export default SymptomSelector;
