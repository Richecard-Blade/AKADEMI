/**
 * PhoneKey Protocol (PKP v1)
 * Shared types between mobile app and desktop agent.
 */

export const PKP_MAGIC = 0x504b; // "PK"
export const PKP_VERSION = 0x01;

export enum PacketType {
  // Control
  Handshake  = 0x01,
  Keepalive  = 0x02,
  Disconnect = 0x03,

  // Keyboard input
  KeyDown    = 0x10,
  KeyUp      = 0x11,
  KeyCombo   = 0x12,

  // Text
  TextInsert = 0x20,

  // Clipboard
  ClipboardSet = 0x30,
  ClipboardGet = 0x31,

  // System
  MediaKey   = 0x40,
  SpecialKey = 0x41,

  // Sync
  ProfileSync = 0x50,
  AppContext  = 0x60,
}

export enum Modifier {
  None    = 0x00,
  Ctrl    = 0x01,
  Shift   = 0x02,
  Alt     = 0x04,
  Super   = 0x08, // Win/Cmd
  AltGr   = 0x10,
  CapsLck = 0x20,
}

export interface KeyEvent {
  keycode: number;      // HID Usage ID
  modifiers: number;    // Bitmask of Modifier flags
  timestampUs: bigint;  // Microsecond timestamp from mobile
  repeat: boolean;
}

export interface TextInsertPayload {
  text: string;
  cursorOffset: number; // Where to place cursor after insertion
}

export interface ClipboardPayload {
  content: string;
  mimeType: 'text/plain' | 'text/html' | 'text/uri-list';
}

export interface AppContextPayload {
  appId: string;       // e.g. "com.microsoft.VSCode"
  appName: string;     // e.g. "Visual Studio Code"
  windowTitle: string;
}

export interface HandshakePayload {
  clientPublicKey: Uint8Array; // ECDH P-256 public key
  totpToken: string;           // 6-digit TOTP
  clientVersion: string;
  platform: 'ios' | 'android';
}

export interface PKPPacket {
  magic: number;
  version: number;
  type: PacketType;
  seqNum: number;
  payload: Uint8Array; // AES-256-GCM encrypted
  crc: number;
}

// HID Usage IDs for common keys
export const HID_KEYCODES: Record<string, number> = {
  A: 0x04, B: 0x05, C: 0x06, D: 0x07, E: 0x08,
  F: 0x09, G: 0x0A, H: 0x0B, I: 0x0C, J: 0x0D,
  K: 0x0E, L: 0x0F, M: 0x10, N: 0x11, O: 0x12,
  P: 0x13, Q: 0x14, R: 0x15, S: 0x16, T: 0x17,
  U: 0x18, V: 0x19, W: 0x1A, X: 0x1B, Y: 0x1C,
  Z: 0x1D,
  '1': 0x1E, '2': 0x1F, '3': 0x20, '4': 0x21, '5': 0x22,
  '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
  Enter: 0x28, Escape: 0x29, Backspace: 0x2A, Tab: 0x2B, Space: 0x2C,
  F1: 0x3A, F2: 0x3B, F3: 0x3C, F4: 0x3D, F5: 0x3E,
  F6: 0x3F, F7: 0x40, F8: 0x41, F9: 0x42, F10: 0x43,
  F11: 0x44, F12: 0x45,
  ArrowRight: 0x4F, ArrowLeft: 0x50, ArrowDown: 0x51, ArrowUp: 0x52,
  Delete: 0x4C, Insert: 0x49, Home: 0x4A, End: 0x4D,
  PageUp: 0x4B, PageDown: 0x4E,
};

export function serializePacket(packet: PKPPacket): ArrayBuffer {
  const payloadLen = packet.payload.byteLength;
  const buffer = new ArrayBuffer(14 + payloadLen);
  const view = new DataView(buffer);

  view.setUint16(0, packet.magic, false);
  view.setUint8(2, packet.version);
  view.setUint8(3, packet.type);
  view.setUint32(4, packet.seqNum, false);
  view.setUint16(8, payloadLen, false);
  new Uint8Array(buffer, 10, payloadLen).set(packet.payload);
  view.setUint32(10 + payloadLen, packet.crc, false);

  return buffer;
}

export function deserializePacket(buffer: ArrayBuffer): PKPPacket | null {
  if (buffer.byteLength < 14) return null;

  const view = new DataView(buffer);
  const magic = view.getUint16(0, false);

  if (magic !== PKP_MAGIC) return null;

  const payloadLen = view.getUint16(8, false);

  if (buffer.byteLength < 14 + payloadLen) return null;

  return {
    magic,
    version: view.getUint8(2),
    type: view.getUint8(3) as PacketType,
    seqNum: view.getUint32(4, false),
    payload: new Uint8Array(buffer, 10, payloadLen),
    crc: view.getUint32(10 + payloadLen, false),
  };
}
