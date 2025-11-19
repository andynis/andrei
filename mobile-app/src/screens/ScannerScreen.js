import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';

import BarcodeService from '../services/BarcodeService';
import DatabaseService from '../database/DatabaseService';
import MLService from '../ml/MLService';

function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);

  const devices = useCameraDevices();
  const device = devices.back;

  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.QR_CODE,
  ]);

  useEffect(() => {
    // Request camera permission
    const requestPermission = async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    };

    requestPermission();
  }, []);

  useEffect(() => {
    // Process barcode when detected
    if (barcodes && barcodes.length > 0 && isScanning && !isProcessing) {
      const barcode = barcodes[0];
      handleBarcodeScanned(barcode.displayValue);
    }
  }, [barcodes, isScanning, isProcessing]);

  const handleBarcodeScanned = async (barcode) => {
    if (!barcode || barcode === scannedCode) return;

    setScannedCode(barcode);
    setIsScanning(false);
    setIsProcessing(true);

    try {
      // Validate barcode
      if (!BarcodeService.validateBarcode(barcode)) {
        Alert.alert('Invalid Barcode', 'The scanned barcode is not valid.');
        resetScanner();
        return;
      }

      // Get product information
      const productInfo = await BarcodeService.getProductInfo(barcode);

      // Check for allergens
      const userProfile = await DatabaseService.getUserProfile();
      if (userProfile) {
        const userAllergens = await DatabaseService.getAllergens(userProfile.id);
        const allergenCheck = BarcodeService.checkAllergens(productInfo, userAllergens);

        if (allergenCheck.hasAllergens) {
          Alert.alert(
            'Allergen Warning!',
            `This product contains: ${allergenCheck.allergens
              .map(a => a.allergen_name)
              .join(', ')}`,
            [
              { text: 'Cancel', onPress: () => resetScanner() },
              { text: 'Add Anyway', onPress: () => addProduct(productInfo) },
            ]
          );
          return;
        }
      }

      // Add product
      await addProduct(productInfo);
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert('Error', 'Failed to process the barcode. Please try again.');
      resetScanner();
    }
  };

  const addProduct = async (productInfo) => {
    try {
      // Add product to database
      const productId = await DatabaseService.addProduct(productInfo);

      // Calculate expiry date
      const scanDate = new Date();
      const shelfLifeDays = productInfo.expiry_info?.estimated_shelf_life_days || 30;
      const expiryDate = BarcodeService.calculateExpiryDate(scanDate, shelfLifeDays);

      // Add to fridge inventory
      await DatabaseService.addToFridge(
        productId,
        productInfo.barcode,
        expiryDate.toISOString().split('T')[0]
      );

      // Log interaction for ML
      const userProfile = await DatabaseService.getUserProfile();
      if (userProfile) {
        await MLService.learn(userProfile.id, {
          type: 'product_scan',
          action: 'scanned',
          productId: productId,
          context: { category: productInfo.category },
        });
      }

      Alert.alert(
        'Success!',
        `${productInfo.product_name} added to your fridge.\nEstimated expiry: ${expiryDate.toLocaleDateString()}`,
        [
          { text: 'Scan Another', onPress: () => resetScanner() },
          { text: 'View Fridge', onPress: () => navigation.navigate('Fridge') },
        ]
      );
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product to fridge.');
      resetScanner();
    }
  };

  const resetScanner = () => {
    setIsProcessing(false);
    setIsScanning(true);
    setScannedCode(null);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required to scan barcodes</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            const status = await Camera.requestCameraPermission();
            setHasPermission(status === 'authorized');
          }}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isScanning}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
      />

      {/* Scanning overlay */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanArea}>
            <View style={styles.scanCorner} style={[styles.topLeft]} />
            <View style={styles.scanCorner} style={[styles.topRight]} />
            <View style={styles.scanCorner} style={[styles.bottomLeft]} />
            <View style={styles.scanCorner} style={[styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          <Text style={styles.instructionText}>
            {isProcessing ? 'Processing...' : 'Align barcode within the frame'}
          </Text>
          {isProcessing && <ActivityIndicator size="large" color="#fff" />}
        </View>
      </View>

      {/* Manual entry button */}
      <TouchableOpacity
        style={styles.manualButton}
        onPress={() => {
          Alert.prompt(
            'Enter Barcode',
            'Type the barcode manually',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'OK',
                onPress: (barcode) => {
                  if (barcode) {
                    handleBarcodeScanned(barcode);
                  }
                },
              },
            ],
            'plain-text'
          );
        }}
      >
        <Text style={styles.manualButtonText}>Enter Manually</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  manualButton: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ScannerScreen;
