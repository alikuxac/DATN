import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { AppText } from '@/components/ui';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode?: CountryCode;
  onSelectCountry?: (country: Country) => void;
  disabled?: boolean;
}

export const PhoneInput = ({ value, onChangeText, countryCode = 'VN', onSelectCountry, disabled }: PhoneInputProps) => {
  const [visible, setVisible] = useState(false);
  const [callingCode, setCallingCode] = useState('84');

  const onSelect = (country: Country) => {
    setCallingCode(country.callingCode[0]);
    if (onSelectCountry) {
        onSelectCountry(country);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.countryButton} 
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <CountryPicker
          visible={visible}
          withFilter
          withFlag
          withCallingCode
          withAlphaFilter
          withEmoji
          onSelect={onSelect}
          onClose={() => setVisible(false)}
          countryCode={countryCode}
          theme={{
             onBackgroundTextColor: '#000', // Adapt to theme if needed
             backgroundColor: '#fff',
          }}
          renderFlagButton={(props) => (
             <View style={styles.flagButton}>
                 <AppText style={styles.flag}>{props.countryCode}</AppText> 
                 {/* Ideally show flag icon or emoji provided by library */}
             </View>
          )}
        />
        <AppText style={styles.callingCode}>+{callingCode}</AppText>
      </TouchableOpacity>
      
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Phone number"
        keyboardType="phone-pad"
        editable={!disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0', // border-input
    borderRadius: 8,
    height: 40,
    overflow: 'hidden',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#f8fafc', // bg-muted
  },
  flagButton: {
      marginRight: 4
  },
  flag: {
     fontSize: 16
  },
  callingCode: {
    fontSize: 14,
    color: '#0f172a',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
  },
});
