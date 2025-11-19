import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatabaseService from '../database/DatabaseService';

function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [allergens, setAllergens] = useState([]);
  const [newAllergen, setNewAllergen] = useState('');
  const [allergenSeverity, setAllergenSeverity] = useState('moderate');
  const [foodLikes, setFoodLikes] = useState([]);
  const [foodDislikes, setFoodDislikes] = useState([]);
  const [newFood, setNewFood] = useState('');
  const [diseases, setDiseases] = useState([]);
  const [newDisease, setNewDisease] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  const commonAllergens = [
    'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish'
  ];

  const commonDiseases = [
    { name: 'Diabetes', restrictions: 'sugar, high-carb' },
    { name: 'Hypertension', restrictions: 'salt, sodium' },
    { name: 'Celiac Disease', restrictions: 'gluten, wheat' },
    { name: 'Lactose Intolerance', restrictions: 'lactose, dairy' },
  ];

  const handleAddAllergen = (allergenName) => {
    if (!allergens.find(a => a.name === allergenName)) {
      setAllergens([...allergens, { name: allergenName, severity: allergenSeverity }]);
    }
  };

  const handleRemoveAllergen = (allergenName) => {
    setAllergens(allergens.filter(a => a.name !== allergenName));
  };

  const handleAddFood = (foodName, type) => {
    if (type === 'like') {
      if (!foodLikes.includes(foodName)) {
        setFoodLikes([...foodLikes, foodName]);
      }
    } else {
      if (!foodDislikes.includes(foodName)) {
        setFoodDislikes([...foodDislikes, foodName]);
      }
    }
    setNewFood('');
  };

  const handleAddDisease = (disease) => {
    if (!diseases.find(d => d.name === disease.name)) {
      setDiseases([...diseases, disease]);
    }
  };

  const handleFinish = async () => {
    try {
      // Validate age
      if (!age || parseInt(age) < 1 || parseInt(age) > 120) {
        Alert.alert('Invalid Age', 'Please enter a valid age');
        return;
      }

      // Create user profile
      const userId = await DatabaseService.createUserProfile(parseInt(age));

      // Add allergens
      for (const allergen of allergens) {
        await DatabaseService.addAllergen(userId, allergen.name, allergen.severity);
      }

      // Add food preferences (likes)
      for (const food of foodLikes) {
        await DatabaseService.addFoodPreference(userId, food, 'like', 8);
      }

      // Add food preferences (dislikes)
      for (const food of foodDislikes) {
        await DatabaseService.addFoodPreference(userId, food, 'dislike', 8);
      }

      // Add diseases
      for (const disease of diseases) {
        await DatabaseService.addDisease(userId, disease.name, disease.restrictions);
      }

      Alert.alert(
        'Welcome!',
        'Your profile has been created. Start scanning products to build your fridge inventory!',
        [
          {
            text: 'Get Started',
            onPress: () => navigation.replace('MainTabs'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Icon name="account" size={80} color="#4CAF50" />
      <Text style={styles.title}>Welcome to Smart Fridge!</Text>
      <Text style={styles.subtitle}>Let's personalize your experience</Text>

      <Text style={styles.label}>What's your age?</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your age"
        keyboardType="number-pad"
        value={age}
        onChangeText={setAge}
      />

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => {
          if (age) {
            setStep(2);
          } else {
            Alert.alert('Required', 'Please enter your age');
          }
        }}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Icon name="arrow-right" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Icon name="alert-circle" size={80} color="#FF9800" />
      <Text style={styles.title}>Do you have any allergens?</Text>
      <Text style={styles.subtitle}>This helps us warn you about unsafe products</Text>

      <View style={styles.chipContainer}>
        {commonAllergens.map(allergen => (
          <TouchableOpacity
            key={allergen}
            style={[
              styles.chip,
              allergens.find(a => a.name === allergen) && styles.chipSelected
            ]}
            onPress={() => {
              if (allergens.find(a => a.name === allergen)) {
                handleRemoveAllergen(allergen);
              } else {
                handleAddAllergen(allergen);
              }
            }}
          >
            <Text style={[
              styles.chipText,
              allergens.find(a => a.name === allergen) && styles.chipTextSelected
            ]}>
              {allergen}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Add custom allergen"
          value={newAllergen}
          onChangeText={setNewAllergen}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (newAllergen) {
              handleAddAllergen(newAllergen);
              setNewAllergen('');
            }
          }}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Icon name="arrow-left" size={20} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Icon name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Icon name="food" size={80} color="#4CAF50" />
      <Text style={styles.title}>Food Preferences</Text>
      <Text style={styles.subtitle}>Tell us what you like and dislike</Text>

      <Text style={styles.sectionLabel}>I like:</Text>
      <View style={styles.chipContainer}>
        {foodLikes.map(food => (
          <View key={food} style={[styles.chip, styles.chipSelected]}>
            <Text style={styles.chipTextSelected}>{food}</Text>
            <TouchableOpacity onPress={() => setFoodLikes(foodLikes.filter(f => f !== food))}>
              <Icon name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>I dislike:</Text>
      <View style={styles.chipContainer}>
        {foodDislikes.map(food => (
          <View key={food} style={[styles.chip, styles.chipDislike]}>
            <Text style={styles.chipTextDislike}>{food}</Text>
            <TouchableOpacity onPress={() => setFoodDislikes(foodDislikes.filter(f => f !== food))}>
              <Icon name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Add food item"
          value={newFood}
          onChangeText={setNewFood}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => newFood && handleAddFood(newFood, 'like')}
        >
          <Icon name="thumb-up" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#F44336' }]}
          onPress={() => newFood && handleAddFood(newFood, 'dislike')}
        >
          <Icon name="thumb-down" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
          <Icon name="arrow-left" size={20} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(4)}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Icon name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Icon name="medical-bag" size={80} color="#2196F3" />
      <Text style={styles.title}>Health Conditions</Text>
      <Text style={styles.subtitle}>Help us recommend suitable meals (optional)</Text>

      <View style={styles.chipContainer}>
        {commonDiseases.map(disease => (
          <TouchableOpacity
            key={disease.name}
            style={[
              styles.chip,
              diseases.find(d => d.name === disease.name) && styles.chipSelected
            ]}
            onPress={() => {
              if (diseases.find(d => d.name === disease.name)) {
                setDiseases(diseases.filter(d => d.name !== disease.name));
              } else {
                handleAddDisease(disease);
              }
            }}
          >
            <Text style={[
              styles.chipText,
              diseases.find(d => d.name === disease.name) && styles.chipTextSelected
            ]}>
              {disease.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
          <Icon name="arrow-left" size={20} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>Finish</Text>
          <Icon name="check" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map(s => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s === step && styles.progressDotActive,
              s < step && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressDot: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#4CAF50',
  },
  progressDotCompleted: {
    backgroundColor: '#81C784',
  },
  stepContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 4,
  },
  chipSelected: {
    backgroundColor: '#4CAF50',
  },
  chipDislike: {
    backgroundColor: '#F44336',
  },
  chipText: {
    color: '#666',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#fff',
    fontSize: 14,
    marginRight: 4,
  },
  chipTextDislike: {
    color: '#fff',
    fontSize: 14,
    marginRight: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 8,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default OnboardingScreen;
