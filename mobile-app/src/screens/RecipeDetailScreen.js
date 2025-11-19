import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatabaseService from '../database/DatabaseService';
import MLService from '../ml/MLService';

function RecipeDetailScreen({ route, navigation }) {
  const { recipe } = route.params;
  const [isSaved, setIsSaved] = useState(false);

  const parseIngredients = () => {
    try {
      const parsed = JSON.parse(recipe.ingredients || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return recipe.ingredients ? recipe.ingredients.split('\n') : [];
    }
  };

  const handleCook = async () => {
    Alert.alert(
      'Mark as Cooked',
      'Did you cook this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const userProfile = await DatabaseService.getUserProfile();
              if (userProfile) {
                await MLService.learn(userProfile.id, {
                  type: 'recipe_cook',
                  action: 'cooked',
                  recipeId: recipe.id,
                  context: { source: 'detail_screen' },
                });
              }
              Alert.alert('Success', 'Recipe marked as cooked!');
            } catch (error) {
              console.error('Error marking as cooked:', error);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      const userProfile = await DatabaseService.getUserProfile();
      if (userProfile) {
        await MLService.learn(userProfile.id, {
          type: 'recipe_view',
          action: 'saved',
          recipeId: recipe.id,
          context: { source: 'detail_screen' },
        });
        setIsSaved(true);
        Alert.alert('Saved', 'Recipe saved to your favorites!');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const ingredients = parseIngredients();

  return (
    <ScrollView style={styles.container}>
      {recipe.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.recipeImage} />
      ) : (
        <View style={[styles.recipeImage, styles.placeholderImage]}>
          <Icon name="chef-hat" size={80} color="#999" />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.recipeName}>{recipe.recipe_name}</Text>

        {recipe.source && (
          <Text style={styles.source}>Source: {recipe.source}</Text>
        )}

        {/* Recipe Info */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Icon name="clock-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{recipe.cooking_time || 30} min</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="chef-hat" size={20} color={getDifficultyColor(recipe.difficulty)} />
            <Text style={[styles.infoText, { color: getDifficultyColor(recipe.difficulty) }]}>
              {recipe.difficulty || 'Medium'}
            </Text>
          </View>

          {recipe.cuisine_type && (
            <View style={styles.infoItem}>
              <Icon name="earth" size={20} color="#666" />
              <Text style={styles.infoText}>{recipe.cuisine_type}</Text>
            </View>
          )}
        </View>

        {/* ML Score */}
        {recipe.mlScore && (
          <View style={styles.scoreBar}>
            <Icon name="star" size={24} color="#FFD700" />
            <Text style={styles.scoreText}>Match Score: {Math.round(recipe.mlScore)}%</Text>
          </View>
        )}

        {/* Recommendation Reason */}
        {recipe.reason && (
          <View style={styles.reasonBox}>
            <Icon name="lightbulb-on" size={20} color="#4CAF50" />
            <Text style={styles.reasonText}>{recipe.reason}</Text>
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="format-list-bulleted" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Ingredients</Text>
          </View>

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Icon name="circle-small" size={20} color="#4CAF50" />
              <Text style={styles.ingredientText}>{ingredient}</Text>
            </View>
          ))}
        </View>

        {/* Instructions */}
        {recipe.instructions && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="book-open-variant" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Instructions</Text>
            </View>
            <Text style={styles.instructionsText}>{recipe.instructions}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cookButton]}
            onPress={handleCook}
          >
            <Icon name="check-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>I Cooked This</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton, isSaved && styles.savedButton]}
            onPress={handleSave}
            disabled={isSaved}
          >
            <Icon name={isSaved ? 'heart' : 'heart-outline'} size={24} color="#fff" />
            <Text style={styles.actionButtonText}>{isSaved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function getDifficultyColor(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return '#4CAF50';
    case 'medium':
      return '#FF9800';
    case 'hard':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  recipeImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  recipeName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  source: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  infoBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  reasonBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  instructionsText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  cookButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  savedButton: {
    backgroundColor: '#999',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RecipeDetailScreen;
