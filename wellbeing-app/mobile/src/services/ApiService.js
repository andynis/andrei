import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api'; // Update with your backend URL

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include app ID
    this.api.interceptors.request.use(
      async config => {
        const appId = await AsyncStorage.getItem('appId');
        if (appId) {
          config.headers['X-App-ID'] = appId;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  async submitCheckIn(checkInData) {
    try {
      const response = await this.api.post('/checkins', checkInData);
      return response.data;
    } catch (error) {
      console.error('API Error - Submit Check-in:', error);
      throw error;
    }
  }

  async registerDevice(userData) {
    try {
      const response = await this.api.post('/register', userData);
      return response.data;
    } catch (error) {
      console.error('API Error - Register:', error);
      throw error;
    }
  }

  async getCheckInHistory(appId) {
    try {
      const response = await this.api.get(`/checkins/${appId}`);
      return response.data;
    } catch (error) {
      console.error('API Error - Get History:', error);
      throw error;
    }
  }
}

export default new ApiService();
