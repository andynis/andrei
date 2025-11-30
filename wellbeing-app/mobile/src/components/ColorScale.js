import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const ColorScale = ({value, onChange, colors, labels}) => {
  return (
    <View style={styles.container}>
      <View style={styles.scaleRow}>
        {colors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.scaleButton,
              {borderColor: color},
              value === index && {backgroundColor: color},
            ]}
            onPress={() => onChange(index)}>
            <View
              style={[
                styles.colorCircle,
                {backgroundColor: color},
                value === index && styles.colorCircleSelected,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{labels[0]}</Text>
        <Text style={styles.labelText}>{labels[labels.length - 1]}</Text>
      </View>
      {value !== null && (
        <Text style={styles.selectedLabel}>{labels[value]}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scaleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  colorCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  colorCircleSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  selectedLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
  },
});

export default ColorScale;
