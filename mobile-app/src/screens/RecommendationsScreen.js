import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatabaseService from '../database/DatabaseService';
import RecommendationService from '../services/RecommendationService';
import MLService from '../ml/MLService';

function RecommendationsScreen({ navigation }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      // Get user profile
      const profile = await DatabaseService.getUserProfile();
      setUserProfile(profile);

      if (!profile) {
        setLoading(false);
        return;
      }

      // Get recommendations
      const recs = await RecommendationService.getRecommendations(profile.id, 20);

      // Enhance with ML scores
      const enhancedRecs = await MLService.rankRecipes(profile.id, recs);

      setRecommendations(enhancedRecs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecommendations();
  };

  const handleRecipePress = async (recipe) => {
    // Log interaction
    if (userProfile) {
      await MLService.learn(userProfile.id, {
        type: 'recipe_view',
        action: 'viewed',
        recipeId: recipe.id,
        context: { source: 'recommendations' },
      });
    }

    navigation.navigate('RecipeDetail', { recipe });
  };

  const getDifficultyColor = (difficulty) => {
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
  };

  const renderRecipeCard = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
      ) : (
        <View style={[styles.recipeImage, styles.placeholderImage]}>
          <Icon name="chef-hat" size={40} color="#999" />
        </View>
      )}

      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={2}>
          {item.recipe_name}
        </Text>

        {item.reason && (
          <Text style={styles.recommendationReason} numberOfLines={2}>
            {item.reason}
          </Text>
        )}

        <View style={styles.recipeDetails}>
          <View style={styles.detailItem}>
            <Icon name="clock-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.cooking_time || 30} min</Text>
          </View>

          <View style={styles.detailItem}>
            <Icon name="chef-hat" size={16} color={getDifficultyColor(item.difficulty)} />
            <Text style={[styles.detailText, { color: getDifficultyColor(item.difficulty) }]}>
              {item.difficulty || 'Medium'}
            </Text>
          </View>

          {item.mlScore && (
            <View style={styles.detailItem}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.detailText}>{Math.round(item.mlScore)}%</Text>
            </View>
          )}
        </View>

        {item.cuisine_type && (
          <Text style={styles.cuisineText}>{item.cuisine_type}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Recipes For You</Text>
      <Text style={styles.headerSubtitle}>
        Personalized recommendations based on your fridge and preferences
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="food-off" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No recommendations yet</Text>
      <Text style={styles.emptySubtext}>
        Add items to your fridge to get personalized recipe suggestions
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Icon name="barcode-scan" size={20} color="#fff" />
        <Text style={styles.scanButtonText}>Scan Products</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Finding perfect recipes for you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recommendations}
        renderItem={renderRecipeCard}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
        contentContainerStyle={recommendations.length === 0 && styles.emptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  recipeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    padding: 15,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recommendationReason: {
    fontSize: 13,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  recipeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  cuisineText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RecommendationsScreen;
