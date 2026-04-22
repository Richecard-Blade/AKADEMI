import React, { useCallback, useRef } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HID_KEYCODES, Modifier } from '../../shared/protocol';

interface KeyProps {
  label: string;
  subLabel?: string;
  keyId: string;
  width?: number;           // Relative width multiplier (1 = standard key)
  isModifier?: boolean;
  isActive?: boolean;       // For toggle keys (Shift, Caps)
  onKeyDown: (keycode: number, modifiers: number) => void;
  onKeyUp: (keycode: number, modifiers: number) => void;
  currentModifiers: number;
}

export const Key: React.FC<KeyProps> = ({
  label,
  subLabel,
  keyId,
  width = 1,
  isModifier = false,
  isActive = false,
  onKeyDown,
  onKeyUp,
  currentModifiers,
}) => {
  const pressedAt = useRef<number>(0);

  const getKeycode = useCallback(() => {
    return HID_KEYCODES[keyId.toUpperCase()] ?? HID_KEYCODES[keyId] ?? 0;
  }, [keyId]);

  const handlePressIn = useCallback(() => {
    pressedAt.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onKeyDown(getKeycode(), currentModifiers);
  }, [getKeycode, currentModifiers, onKeyDown]);

  const handlePressOut = useCallback(() => {
    onKeyUp(getKeycode(), currentModifiers);
  }, [getKeycode, currentModifiers, onKeyUp]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.key,
        { flex: width },
        isModifier && styles.modifierKey,
        isActive && styles.activeKey,
        pressed && styles.pressedKey,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityHint={`Types ${label}`}
    >
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
      <Text style={[styles.label, isModifier && styles.modifierLabel]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  key: {
    backgroundColor: '#0F3460',
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#091F3A',
    marginHorizontal: 3,
    marginVertical: 3,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
  } as ViewStyle,
  modifierKey: {
    backgroundColor: '#1A1A4E',
  } as ViewStyle,
  activeKey: {
    backgroundColor: '#E94560',
  } as ViewStyle,
  pressedKey: {
    backgroundColor: '#E94560',
    borderBottomWidth: 0,
    transform: [{ translateY: 2 }],
  } as ViewStyle,
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  modifierLabel: {
    fontSize: 13,
  } as TextStyle,
  subLabel: {
    color: '#8888BB',
    fontSize: 9,
    position: 'absolute',
    top: 4,
    right: 5,
  } as TextStyle,
});
