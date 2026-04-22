import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { KeyboardLayout } from '../components/KeyboardLayout';
import { ConnectionManager, ConnectionState } from '../services/ConnectionManager';

const TRANSPORT_LABEL: Record<string, string> = {
  usb:  'USB ⚡',
  wifi: 'WiFi ◉',
  ble:  'BLE ⬡',
  none: 'Déconnecté',
};

const TRANSPORT_COLOR: Record<string, string> = {
  usb:  '#00C896',
  wifi: '#00C896',
  ble:  '#FFB800',
  none: '#FF4757',
};

let manager: ConnectionManager | null = null;

export const KeyboardScreen: React.FC = () => {
  const [state, setState] = useState<ConnectionState>({
    transport: 'none',
    connected: false,
    latencyMs: 0,
    peerName: '',
  });

  useEffect(() => {
    manager = new ConnectionManager(setState);
    manager.connectBest();
    return () => manager?.disconnect();
  }, []);

  const handleKeyDown = (keycode: number, modifiers: number) => {
    manager?.sendKeyEvent(keycode, modifiers, true);
  };

  const handleKeyUp = (keycode: number, modifiers: number) => {
    manager?.sendKeyEvent(keycode, modifiers, false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />

      {/* Top status bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>PhoneKey</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: TRANSPORT_COLOR[state.transport] }]} />
          <Text style={[styles.statusText, { color: TRANSPORT_COLOR[state.transport] }]}>
            {TRANSPORT_LABEL[state.transport]}
          </Text>
          {state.connected && state.latencyMs > 0 && (
            <Text style={styles.latencyText}> {state.latencyMs}ms</Text>
          )}
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Connection prompt when disconnected */}
      {!state.connected && (
        <View style={styles.disconnectedBanner}>
          <Text style={styles.disconnectedText}>
            Connectez un câble USB ou ouvrez l'agent sur votre ordinateur
          </Text>
          <TouchableOpacity
            style={styles.reconnectButton}
            onPress={() => manager?.connectBest()}
          >
            <Text style={styles.reconnectButtonText}>Reconnecter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Keyboard */}
      <View style={styles.keyboardContainer}>
        <KeyboardLayout onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />
      </View>

      {/* Quick action bar */}
      <View style={styles.quickBar}>
        {['Copier', 'Coller', 'Tout sél.', 'Annuler', 'Rétablir'].map((label, i) => (
          <TouchableOpacity key={i} style={styles.quickAction}>
            <Text style={styles.quickActionText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0F1A' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A5E',
  },
  appName: { color: '#EEEEFF', fontWeight: '700', fontSize: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '500' },
  latencyText: { color: '#8888BB', fontSize: 12 },
  settingsButton: { padding: 4 },
  settingsIcon: { color: '#8888BB', fontSize: 18 },
  disconnectedBanner: {
    backgroundColor: '#2A1A1A',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FF4757',
  },
  disconnectedText: { color: '#FF8080', fontSize: 13, textAlign: 'center' },
  reconnectButton: {
    marginTop: 8,
    backgroundColor: '#E94560',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reconnectButtonText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  keyboardContainer: { flex: 1, justifyContent: 'flex-end' },
  quickBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#2A2A5E',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  quickActionText: { color: '#8888BB', fontSize: 11, fontWeight: '500' },
});
