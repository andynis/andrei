import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import DatabaseService from '../database/DatabaseService';

class NotificationService {
  constructor() {
    this.configured = false;
  }

  /**
   * Configure push notifications
   */
  configure() {
    if (this.configured) return;

    PushNotification.configure({
      // Called when a remote or local notification is opened or received
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);

        // Required on iOS only
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      // iOS permissions
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      // Request permissions on app launch
      requestPermissions: true,
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'expiry-warnings',
          channelName: 'Expiry Warnings',
          channelDescription: 'Notifications for expiring products',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        created => console.log(`Expiry channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'recommendations',
          channelName: 'Recipe Recommendations',
          channelDescription: 'Personalized recipe suggestions',
          playSound: false,
          importance: 3,
          vibrate: false,
        },
        created => console.log(`Recommendations channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'shopping-reminders',
          channelName: 'Shopping Reminders',
          channelDescription: 'Reminders to restock items',
          playSound: true,
          soundName: 'default',
          importance: 3,
          vibrate: true,
        },
        created => console.log(`Shopping channel created: ${created}`)
      );
    }

    this.configured = true;
  }

  /**
   * Check for expiring products and send notifications
   */
  async checkExpiringProducts() {
    try {
      // Get products expiring in next 3 days
      const expiringProducts = await DatabaseService.getExpiringProducts(3);

      if (expiringProducts.length === 0) {
        console.log('No expiring products found');
        return;
      }

      // Group by days until expiry
      const groupedProducts = this.groupByExpiryDays(expiringProducts);

      // Send notifications for each group
      for (const [days, products] of Object.entries(groupedProducts)) {
        await this.sendExpiryNotification(parseInt(days), products);
      }
    } catch (error) {
      console.error('Error checking expiring products:', error);
    }
  }

  /**
   * Group products by days until expiry
   */
  groupByExpiryDays(products) {
    const grouped = {};

    products.forEach(product => {
      const daysUntilExpiry = this.getDaysUntilExpiry(product.expiry_date);

      if (!grouped[daysUntilExpiry]) {
        grouped[daysUntilExpiry] = [];
      }

      grouped[daysUntilExpiry].push(product);
    });

    return grouped;
  }

  /**
   * Send expiry warning notification
   */
  async sendExpiryNotification(daysUntilExpiry, products) {
    const productNames = products.map(p => p.product_name).join(', ');
    let title, message;

    if (daysUntilExpiry === 0) {
      title = '⚠️ Products Expiring Today!';
      message = `These items expire today: ${productNames}`;
    } else if (daysUntilExpiry === 1) {
      title = '⏰ Products Expiring Tomorrow';
      message = `Use soon: ${productNames}`;
    } else {
      title = `📅 Products Expiring in ${daysUntilExpiry} Days`;
      message = `Plan to use: ${productNames}`;
    }

    this.sendLocalNotification({
      channelId: 'expiry-warnings',
      title: title,
      message: message,
      data: { type: 'expiry', products: products },
      priority: 'high',
    });

    // Log notification in database
    for (const product of products) {
      await DatabaseService.logNotification(
        product.id,
        'expiry_warning',
        message
      );
    }
  }

  /**
   * Send recipe recommendation notification
   */
  async sendRecipeRecommendation(recipe, reason) {
    const title = '🍳 Recipe Suggestion';
    const message = `Try making ${recipe.recipe_name}! ${reason}`;

    this.sendLocalNotification({
      channelId: 'recommendations',
      title: title,
      message: message,
      data: { type: 'recipe', recipeId: recipe.id },
      priority: 'default',
    });
  }

  /**
   * Send shopping reminder notification
   */
  async sendShoppingReminder(items) {
    const title = '🛒 Shopping Reminder';
    const message = `You're running low on: ${items.join(', ')}`;

    this.sendLocalNotification({
      channelId: 'shopping-reminders',
      title: title,
      message: message,
      data: { type: 'shopping', items: items },
      priority: 'default',
    });
  }

  /**
   * Send local notification
   */
  sendLocalNotification(options) {
    const { channelId, title, message, data, priority = 'default' } = options;

    PushNotification.localNotification({
      channelId: channelId,
      title: title,
      message: message,
      userInfo: data,
      priority: priority,
      importance: priority === 'high' ? 'high' : 'default',
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
    });
  }

  /**
   * Schedule daily check for expiring products
   */
  scheduleDailyExpiryCheck() {
    // Schedule notification to run daily at 9 AM
    const date = new Date();
    date.setHours(9);
    date.setMinutes(0);
    date.setSeconds(0);

    // If 9 AM already passed today, schedule for tomorrow
    if (date < new Date()) {
      date.setDate(date.getDate() + 1);
    }

    PushNotification.localNotificationSchedule({
      channelId: 'expiry-warnings',
      title: 'Fridge Check',
      message: 'Time to check your fridge for expiring items',
      date: date,
      repeatType: 'day',
      allowWhileIdle: true,
    });
  }

  /**
   * Cancel all notifications
   */
  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  /**
   * Cancel specific notification
   */
  cancelNotification(notificationId) {
    PushNotification.cancelLocalNotification(notificationId);
  }

  /**
   * Get badge number (iOS)
   */
  getBadgeNumber() {
    if (Platform.OS === 'ios') {
      PushNotification.getApplicationIconBadgeNumber(number => {
        return number;
      });
    }
    return 0;
  }

  /**
   * Set badge number (iOS)
   */
  setBadgeNumber(number) {
    if (Platform.OS === 'ios') {
      PushNotification.setApplicationIconBadgeNumber(number);
    }
  }

  /**
   * Calculate days until expiry
   */
  getDaysUntilExpiry(expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    return new Promise((resolve, reject) => {
      PushNotification.requestPermissions()
        .then(permissions => {
          console.log('Notification permissions:', permissions);
          resolve(permissions);
        })
        .catch(error => {
          console.error('Error requesting permissions:', error);
          reject(error);
        });
    });
  }

  /**
   * Check notification permissions
   */
  async checkPermissions() {
    return new Promise(resolve => {
      PushNotification.checkPermissions(permissions => {
        resolve(permissions);
      });
    });
  }
}

export default new NotificationService();
