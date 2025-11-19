import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatabaseService from '../database/DatabaseService';
import NotificationService from '../services/NotificationService';
import MLService from '../ml/MLService';

function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [allergens, setAllergens] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    recipesCooked: 0,
    foodSaved: 0,
  });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await DatabaseService.getUserProfile();
      setUserProfile(profile);

      if (profile) {
        const userAllergens = await DatabaseService.getAllergens(profile.id);
        const userPreferences = await DatabaseService.getFoodPreferences(profile.id);
        const userDiseases = await DatabaseService.getDiseases(profile.id);

        setAllergens(userAllergens);
        setPreferences(userPreferences);
        setDiseases(userDiseases);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    try {
      const inventory = await DatabaseService.getFridgeInventory();
      const consumed = inventory.filter(item => item.status === 'consumed');

      setStats({
        totalProducts: inventory.length,
        recipesCooked: consumed.length,
        foodSaved: Math.floor(consumed.length * 1.5), // Estimate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);

    if (value) {
      NotificationService.scheduleDailyExpiryCheck();
      Alert.alert('Notifications Enabled', 'You will receive alerts for expiring products');
    } else {
      NotificationService.cancelAllNotifications();
      Alert.alert('Notifications Disabled', 'You will not receive any alerts');
    }
  };

  const handleRetrainML = async () => {
    Alert.alert(
      'Retrain Recommendations',
      'This will update your personalized recommendations based on your recent activity.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retrain',
          onPress: async () => {
            try {
              if (userProfile) {
                await MLService.trainModel(userProfile.id);
                Alert.alert('Success', 'Recommendations have been updated!');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to retrain model');
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your data including products, preferences, and history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.closeDatabase();
              await MLService.clearModel();
              Alert.alert('Success', 'All data has been cleared. Please restart the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const renderSection = (title, icon, children) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={24} color="#4CAF50" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Icon name="fridge" size={32} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Products Tracked</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="check-circle" size={32} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.foodSaved}</Text>
          <Text style={styles.statLabel}>Food Items Saved</Text>
        </View>
      </View>

      {/* Profile Info */}
      {renderSection('Profile', 'account', (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Age:</Text>
          <Text style={styles.infoValue}>{userProfile?.age || 'Not set'}</Text>
        </View>
      ))}

      {/* Allergens */}
      {renderSection('Allergens', 'alert-circle', (
        <View>
          {allergens.length > 0 ? (
            <View style={styles.chipContainer}>
              {allergens.map(allergen => (
                <View key={allergen.id} style={styles.allergenChip}>
                  <Text style={styles.chipText}>{allergen.allergen_name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No allergens added</Text>
          )}
        </View>
      ))}

      {/* Food Preferences */}
      {renderSection('Food Preferences', 'food', (
        <View>
          <Text style={styles.subsectionTitle}>Likes:</Text>
          {preferences.filter(p => p.preference_type === 'like').length > 0 ? (
            <View style={styles.chipContainer}>
              {preferences
                .filter(p => p.preference_type === 'like')
                .map(pref => (
                  <View key={pref.id} style={styles.likeChip}>
                    <Text style={styles.chipText}>{pref.food_item}</Text>
                  </View>
                ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No likes added</Text>
          )}

          <Text style={[styles.subsectionTitle, { marginTop: 12 }]}>Dislikes:</Text>
          {preferences.filter(p => p.preference_type === 'dislike').length > 0 ? (
            <View style={styles.chipContainer}>
              {preferences
                .filter(p => p.preference_type === 'dislike')
                .map(pref => (
                  <View key={pref.id} style={styles.dislikeChip}>
                    <Text style={styles.chipText}>{pref.food_item}</Text>
                  </View>
                ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No dislikes added</Text>
          )}
        </View>
      ))}

      {/* Health Conditions */}
      {renderSection('Health Conditions', 'medical-bag', (
        <View>
          {diseases.length > 0 ? (
            diseases.map(disease => (
              <View key={disease.id} style={styles.diseaseRow}>
                <Text style={styles.diseaseName}>{disease.disease_name}</Text>
                {disease.dietary_restrictions && (
                  <Text style={styles.diseaseRestrictions}>
                    Avoid: {disease.dietary_restrictions}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No health conditions added</Text>
          )}
        </View>
      ))}

      {/* Settings */}
      {renderSection('Settings', 'cog', (
        <View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Icon name="bell" size={20} color="#666" />
              <Text style={styles.settingText}>Expiry Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#ddd', true: '#81C784' }}
              thumbColor={notificationsEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={handleRetrainML}>
            <View style={styles.settingLeft}>
              <Icon name="brain" size={20} color="#666" />
              <Text style={styles.settingText}>Retrain Recommendations</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <Icon name="delete" size={20} color="#F44336" />
              <Text style={[styles.settingText, { color: '#F44336' }]}>Clear All Data</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      ))}

      {/* About */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutText}>Smart Fridge Scanner</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
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
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenChip: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  likeChip: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  dislikeChip: {
    backgroundColor: '#FFCDD2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  chipText: {
    fontSize: 13,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  diseaseRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  diseaseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  diseaseRestrictions: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  aboutSection: {
    alignItems: 'center',
    padding: 30,
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;
