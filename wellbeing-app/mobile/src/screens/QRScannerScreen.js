import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {RNCamera} from 'react-native-camera';

const QRScannerScreen = ({navigation}) => {
  const [scanning, setScanning] = useState(true);

  const onSuccess = e => {
    if (!scanning) return;

    setScanning(false);

    try {
      // Parse QR code data (format: {classroomId: string, schoolId: string})
      const data = JSON.parse(e.data);

      if (data.classroomId && data.schoolId) {
        // Store classroom info
        navigation.navigate('CheckIn', {
          classroomId: data.classroomId,
          schoolId: data.schoolId,
        });
      } else {
        Alert.alert('Invalid QR Code', 'This is not a valid classroom QR code.', [
          {text: 'Try Again', onPress: () => setScanning(true)},
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not read QR code. Please try again.', [
        {text: 'Try Again', onPress: () => setScanning(true)},
      ]);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const {check, request, PERMISSIONS, RESULTS} = require('react-native-permissions');
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);

      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access in settings to scan QR codes.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => Linking.openSettings()},
            ]
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Classroom QR Code</Text>
        <Text style={styles.instructions}>
          Point your camera at the QR code displayed in your classroom
        </Text>
      </View>

      <QRCodeScanner
        onRead={onSuccess}
        reactivate={scanning}
        reactivateTimeout={500}
        flashMode={RNCamera.Constants.FlashMode.off}
        topContent={
          <View style={styles.topContent}>
            <Text style={styles.centerText}>
              Position the QR code within the frame
            </Text>
          </View>
        }
        bottomContent={
          <TouchableOpacity
            style={styles.buttonTouchable}
            onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        }
        cameraStyle={styles.camera}
        containerStyle={styles.scannerContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#E8F4F8',
    textAlign: 'center',
  },
  topContent: {
    padding: 20,
  },
  centerText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    height: '100%',
  },
  buttonTouchable: {
    padding: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    margin: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default QRScannerScreen;
