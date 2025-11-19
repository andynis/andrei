import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatabaseService from '../database/DatabaseService';

function FridgeScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, fresh, expiring, expired

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [])
  );

  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await DatabaseService.getFridgeInventory();

      // Update status based on expiry dates
      const updatedItems = items.map(item => {
        if (item.expiry_date) {
          const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);

          if (daysUntilExpiry < 0) {
            DatabaseService.updateInventoryStatus(item.id, 'expired');
            return { ...item, status: 'expired' };
          } else if (daysUntilExpiry <= 3) {
            DatabaseService.updateInventoryStatus(item.id, 'near_expiry');
            return { ...item, status: 'near_expiry' };
          }
        }
        return item;
      });

      setInventory(updatedItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
      Alert.alert('Error', 'Failed to load fridge inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status) => {
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
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'expired':
        return 'alert-circle';
      case 'near_expiry':
        return 'alert';
      case 'fresh':
        return 'check-circle';
      default:
        return 'circle';
    }
  };

  const handleConsume = async (item) => {
    Alert.alert(
      'Consume Product',
      `Mark "${item.product_name}" as consumed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            await DatabaseService.consumeProduct(item.id);
            loadInventory();
          },
        },
      ]
    );
  };

  const filterInventory = () => {
    if (filter === 'all') return inventory;
    if (filter === 'fresh') return inventory.filter(item => item.status === 'fresh');
    if (filter === 'expiring') return inventory.filter(item => item.status === 'near_expiry');
    if (filter === 'expired') return inventory.filter(item => item.status === 'expired');
    return inventory;
  };

  const renderItem = ({ item }) => {
    const daysUntilExpiry = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <View style={styles.itemLeft}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Icon name="food-apple" size={30} color="#999" />
            </View>
          )}

          <View style={styles.itemInfo}>
            <Text style={styles.productName}>{item.product_name}</Text>
            {item.brand && <Text style={styles.brandText}>{item.brand}</Text>}
            <Text style={styles.scanDate}>
              Added: {new Date(item.scan_date).toLocaleDateString()}
            </Text>
            {item.expiry_date && (
              <Text style={[styles.expiryText, { color: getStatusColor(item.status) }]}>
                {daysUntilExpiry < 0
                  ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                  : daysUntilExpiry === 0
                  ? 'Expires today'
                  : `Expires in ${daysUntilExpiry} days`}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.itemRight}>
          <Icon
            name={getStatusIcon(item.status)}
            size={24}
            color={getStatusColor(item.status)}
          />
          <TouchableOpacity
            style={styles.consumeButton}
            onPress={() => handleConsume(item)}
          >
            <Icon name="check" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{inventory.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {inventory.filter(i => i.status === 'fresh').length}
          </Text>
          <Text style={styles.statLabel}>Fresh</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {inventory.filter(i => i.status === 'near_expiry').length}
          </Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'fresh' && styles.filterButtonActive]}
          onPress={() => setFilter('fresh')}
        >
          <Text style={[styles.filterText, filter === 'fresh' && styles.filterTextActive]}>
            Fresh
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expiring' && styles.filterButtonActive]}
          onPress={() => setFilter('expiring')}
        >
          <Text style={[styles.filterText, filter === 'expiring' && styles.filterTextActive]}>
            Expiring
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expired' && styles.filterButtonActive]}
          onPress={() => setFilter('expired')}
        >
          <Text style={[styles.filterText, filter === 'expired' && styles.filterTextActive]}>
            Expired
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredData = filterInventory();

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="fridge-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Your fridge is empty</Text>
            <Text style={styles.emptySubtext}>Start scanning products to track your inventory</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scanner')}
            >
              <Icon name="barcode-scan" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Scan Product</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
        contentContainerStyle={filteredData.length === 0 && styles.emptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  brandText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  scanDate: {
    fontSize: 11,
    color: '#999',
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'center',
    marginLeft: 10,
  },
  consumeButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
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

export default FridgeScreen;
