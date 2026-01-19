// components/ui/TextInput.tsx
import React from 'react';
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, StyleSheet } from 'react-native';

interface TextInputProps extends RNTextInputProps {
  fontWeight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export const TextInput: React.FC<TextInputProps> = ({ 
  style, 
  fontWeight = 'regular',
  ...props 
}) => {
  const fontFamily = {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semibold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
  }[fontWeight];

  return (
    <RNTextInput 
      style={StyleSheet.flatten([{ fontFamily }, style])} 
      {...props} 
    />
  );
};