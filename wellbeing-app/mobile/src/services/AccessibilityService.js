import {Platform, AccessibilityInfo, Vibration} from 'react-native';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';

class AccessibilityService {
  constructor() {
    this.isScreenReaderEnabled = false;
    this.isTtsInitialized = false;
    this.initializeTts();
    this.checkScreenReader();
  }

  async initializeTts() {
    try {
      await Tts.getInitStatus();
      this.isTtsInitialized = true;

      // Set default language
      if (Platform.OS === 'android') {
        Tts.setDefaultLanguage('en-US');
      }

      // Set speech rate (slightly slower for clarity)
      Tts.setDefaultRate(0.5);
    } catch (error) {
      console.log('TTS not available:', error);
    }
  }

  async checkScreenReader() {
    try {
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.log('Screen reader check failed:', error);
    }
  }

  /**
   * Speak text aloud (for blind users)
   */
  async speak(text, interrupt = false) {
    if (!this.isTtsInitialized) return;

    try {
      if (interrupt) {
        await Tts.stop();
      }
      await Tts.speak(text);
    } catch (error) {
      console.log('TTS speak error:', error);
    }
  }

  /**
   * Stop speaking
   */
  async stopSpeaking() {
    if (!this.isTtsInitialized) return;
    try {
      await Tts.stop();
    } catch (error) {
      console.log('TTS stop error:', error);
    }
  }

  /**
   * Vibrate for feedback (for deaf users)
   * @param {string} pattern - 'short', 'long', 'success', 'error', 'alert'
   */
  vibrate(pattern = 'short') {
    const patterns = {
      short: [0, 100],
      long: [0, 500],
      success: [0, 50, 100, 50],
      error: [0, 100, 100, 100],
      alert: [0, 200, 100, 200, 100, 200],
    };

    Vibration.vibrate(patterns[pattern] || patterns.short);
  }

  /**
   * Initialize voice recognition
   */
  async initVoice() {
    try {
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechError = this.onSpeechError;
    } catch (error) {
      console.log('Voice init error:', error);
    }
  }

  /**
   * Start listening for voice input
   */
  async startListening() {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.log('Voice start error:', error);
    }
  }

  /**
   * Stop listening
   */
  async stopListening() {
    try {
      await Voice.stop();
    } catch (error) {
      console.log('Voice stop error:', error);
    }
  }

  /**
   * Announce a selection (for screen readers and audio feedback)
   */
  announceSelection(itemName, value) {
    const text = `${itemName} selected: ${value}`;
    this.speak(text);
    this.vibrate('short');
  }

  /**
   * Announce navigation
   */
  announceNavigation(screenName) {
    const text = `${screenName} screen`;
    this.speak(text);
  }

  /**
   * Announce success
   */
  announceSuccess(message) {
    this.speak(message);
    this.vibrate('success');
  }

  /**
   * Announce error
   */
  announceError(message) {
    this.speak(message);
    this.vibrate('error');
  }

  /**
   * Read question aloud
   */
  readQuestion(question, options) {
    const optionsText = options ? `. Options: ${options.join(', ')}` : '';
    const text = `${question}${optionsText}`;
    this.speak(text);
  }

  /**
   * Get accessibility props for a component
   */
  getAccessibilityProps(label, hint, role = 'button') {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: role,
    };
  }

  /**
   * Create large touch target (minimum 44x44 for accessibility)
   */
  getLargeTouchTarget() {
    return {
      minWidth: 44,
      minHeight: 44,
    };
  }
}

export default new AccessibilityService();
