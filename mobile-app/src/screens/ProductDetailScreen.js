import React from 'react';
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

function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;

  const handleDelete = () => {
    Alert.alert(
      'Remove Product',
      `Remove "${product.product_name}" from your fridge?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await DatabaseService.consumeProduct(product.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const parseNutrition = () => {
    try {
      return JSON.parse(product.nutrition_data || '{}');
    } catch {
      return {};
    }
  };

  const nutrition = parseNutrition();
  const expiryDate = product.expiry_date ? new Date(product.expiry_date) : null;
  const scanDate = new Date(product.scan_date);

  return (
    <ScrollView style={styles.container}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.placeholderImage]}>
          <Icon name="food-apple" size={80} color="#999" />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.productName}>{product.product_name}</Text>
        {product.brand && <Text style={styles.brand}>{product.brand}</Text>}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
          <Text style={styles.statusText}>{getStatusText(product.status)}</Text>
        </View>

        {/* Dates Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="calendar" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Dates</Text>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Added:</Text>
            <Text style={styles.dateValue}>{scanDate.toLocaleDateString()}</Text>
          </View>

          {expiryDate && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Expires:</Text>
              <Text style={styles.dateValue}>{expiryDate.toLocaleDateString()}</Text>
            </View>
          )}
        </View>

        {/* Category */}
        {product.category && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="tag" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Category</Text>
            </View>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        )}

        {/* Ingredients */}
        {product.ingredients && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="format-list-bulleted" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Ingredients</Text>
            </View>
            <Text style={styles.ingredientsText}>{product.ingredients}</Text>
          </View>
        )}

        {/* Allergens */}
        {product.allergens && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.warningSection]}>
              <Icon name="alert-circle" size={24} color="#FF9800" />
              <Text style={[styles.sectionTitle, { color: '#FF9800' }]}>Allergens</Text>
            </View>
            <Text style={styles.allergensText}>{product.allergens}</Text>
          </View>
        )}

        {/* Nutrition */}
        {Object.keys(nutrition).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="nutrition" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
            </View>

            {nutrition.energy && (
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Energy:</Text>
                <Text style={styles.nutritionValue}>{nutrition.energy} kcal</Text>
              </View>
            )}
            {nutrition.fat && (
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Fat:</Text>
                <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
              </View>
            )}
            {nutrition.carbohydrates && (
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Carbohydrates:</Text>
                <Text style={styles.nutritionValue}>{nutrition.carbohydrates}g</Text>
              </View>
            )}
            {nutrition.proteins && (
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Proteins:</Text>
                <Text style={styles.nutritionValue}>{nutrition.proteins}g</Text>
              </View>
            )}
            {nutrition.salt && (
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Salt:</Text>
                <Text style={styles.nutritionValue}>{nutrition.salt}g</Text>
              </View>
            )}
          </View>
        )}

        {/* Barcode */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="barcode" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Barcode</Text>
          </View>
          <Text style={styles.barcodeText}>{product.barcode}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Icon name="delete" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Remove from Fridge</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'expired':
      return '#F44336';
    case 'near_expiry':
      return '#FF9800';
    case 'fresh':
      return '#4CAF50';
    default:
      return '#9E9E9E';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'expired':
      return 'Expired';
    case 'near_expiry':
      return 'Expiring Soon';
    case 'fresh':
      return 'Fresh';
    default:
      return 'Unknown';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
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
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  brand: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    marginBottom: 12,
  },
  warningSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dateLabel: {
    fontSize: 15,
    color: '#666',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  categoryText: {
    fontSize: 15,
    color: '#666',
  },
  ingredientsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  allergensText: {
    fontSize: 15,
    color: '#F44336',
    fontWeight: '500',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  nutritionLabel: {
    fontSize: 15,
    color: '#666',
  },
  nutritionValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  barcodeText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#333',
    textAlign: 'center',
  },
  actions: {
    marginTop: 10,
    marginBottom: 30,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProductDetailScreen;
