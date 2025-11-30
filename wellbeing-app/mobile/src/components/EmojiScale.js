import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const emojis = [
  {value: 0, emoji: '😢', label: 'Very sad'},
  {value: 1, emoji: '😞', label: 'Sad'},
  {value: 2, emoji: '😐', label: 'Okay'},
  {value: 3, emoji: '🙂', label: 'Good'},
  {value: 4, emoji: '😊', label: 'Happy'},
  {value: 5, emoji: '😄', label: 'Very happy'},
];

const EmojiScale = ({value, onChange}) => {
  return (
    <View style={styles.container}>
      <View style={styles.emojiRow}>
        {emojis.map(item => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.emojiButton,
              value === item.value && styles.emojiButtonSelected,
            ]}
            onPress={() => onChange(item.value)}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text
              style={[
                styles.label,
                value === item.value && styles.labelSelected,
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  emojiButton: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  emojiButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E8F4F8',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default EmojiScale;
