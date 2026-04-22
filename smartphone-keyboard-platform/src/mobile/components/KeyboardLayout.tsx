import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Key } from './Key';
import { Modifier } from '../../shared/protocol';

interface KeyboardLayoutProps {
  onKeyDown: (keycode: number, modifiers: number) => void;
  onKeyUp: (keycode: number, modifiers: number) => void;
}

const QWERTY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Backspace'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '!', 'Enter'],
];

const SPECIAL_ROW = [
  { id: 'Ctrl',       label: 'Ctrl',  width: 1.4 },
  { id: 'Alt',        label: 'Alt',   width: 1.2 },
  { id: 'Space',      label: ' ',     width: 4.5 },
  { id: 'ArrowLeft',  label: '←',     width: 1.0 },
  { id: 'ArrowRight', label: '→',     width: 1.0 },
  { id: 'Escape',     label: 'Esc',   width: 1.3 },
];

const KEY_DISPLAY: Record<string, { label: string; width?: number; isModifier?: boolean }> = {
  Backspace:  { label: '⌫',    width: 1.8, isModifier: false },
  Enter:      { label: '↵',    width: 1.8 },
  Shift:      { label: '⇧',    width: 1.6, isModifier: true },
  Space:      { label: ' ',    width: 4.5 },
  Ctrl:       { label: 'Ctrl', width: 1.4, isModifier: true },
  Alt:        { label: 'Alt',  width: 1.2, isModifier: true },
  ArrowLeft:  { label: '←' },
  ArrowRight: { label: '→' },
  Escape:     { label: 'Esc', width: 1.3 },
};

export const KeyboardLayout: React.FC<KeyboardLayoutProps> = ({ onKeyDown, onKeyUp }) => {
  const [modifiers, setModifiers] = useState<number>(Modifier.None);
  const [shiftActive, setShiftActive] = useState(false);
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);

  const handleModifierDown = useCallback((mod: Modifier, active: boolean, setActive: (v: boolean) => void) => {
    const next = active ? modifiers & ~mod : modifiers | mod;
    setModifiers(next);
    setActive(!active);
  }, [modifiers]);

  const handleKeyDown = useCallback((keycode: number, _mods: number) => {
    onKeyDown(keycode, modifiers);
  }, [modifiers, onKeyDown]);

  const handleKeyUp = useCallback((keycode: number, _mods: number) => {
    onKeyUp(keycode, modifiers);
    // Auto-release non-sticky modifiers after key use
    if (shiftActive) {
      setModifiers(m => m & ~Modifier.Shift);
      setShiftActive(false);
    }
  }, [modifiers, shiftActive, onKeyUp]);

  const renderKey = (keyId: string, index: number) => {
    const meta = KEY_DISPLAY[keyId] ?? { label: keyId };
    const isModifier = meta.isModifier === true || ['Ctrl', 'Alt', 'Shift'].includes(keyId);
    const isActive =
      (keyId === 'Shift' && shiftActive) ||
      (keyId === 'Ctrl' && ctrlActive) ||
      (keyId === 'Alt' && altActive);

    const handleDown = isModifier
      ? () => {
          if (keyId === 'Shift') handleModifierDown(Modifier.Shift, shiftActive, setShiftActive);
          if (keyId === 'Ctrl') handleModifierDown(Modifier.Ctrl, ctrlActive, setCtrlActive);
          if (keyId === 'Alt') handleModifierDown(Modifier.Alt, altActive, setAltActive);
        }
      : (kc: number, m: number) => handleKeyDown(kc, m);

    return (
      <Key
        key={`${keyId}-${index}`}
        keyId={keyId}
        label={meta.label}
        width={meta.width}
        isModifier={isModifier}
        isActive={isActive}
        currentModifiers={modifiers}
        onKeyDown={isModifier ? () => {} : handleKeyDown}
        onKeyUp={isModifier ? () => {} : handleKeyUp}
      />
    );
  };

  return (
    <View style={styles.container}>
      {QWERTY_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((keyId, i) => renderKey(keyId, i))}
        </View>
      ))}
      <View style={styles.row}>
        {SPECIAL_ROW.map((key, i) => (
          <Key
            key={i}
            keyId={key.id}
            label={key.label}
            width={key.width}
            isModifier={['Ctrl', 'Alt', 'Escape'].includes(key.id)}
            isActive={
              (key.id === 'Ctrl' && ctrlActive) ||
              (key.id === 'Alt' && altActive)
            }
            currentModifiers={modifiers}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213E',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 0,
  },
});
