/**
 * ConnectionManager — Handles transport priority and auto-reconnect.
 *
 * Priority: USB > WiFi > BLE
 * Switches transparently without dropping keystrokes.
 */

import { PKPPacket, PacketType, PKP_MAGIC, PKP_VERSION, serializePacket } from '../../shared/protocol';

export type TransportType = 'usb' | 'wifi' | 'ble' | 'none';

export interface ConnectionState {
  transport: TransportType;
  connected: boolean;
  latencyMs: number;
  peerName: string;
}

interface Transport {
  type: TransportType;
  send(data: ArrayBuffer): Promise<void>;
  disconnect(): void;
  onMessage(handler: (data: ArrayBuffer) => void): void;
}

export class ConnectionManager {
  private transport: Transport | null = null;
  private seqNum = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private onStateChange: (state: ConnectionState) => void;

  constructor(onStateChange: (state: ConnectionState) => void) {
    this.onStateChange = onStateChange;
  }

  async connectBest(): Promise<void> {
    const transportPriority: TransportType[] = ['usb', 'wifi', 'ble'];

    for (const type of transportPriority) {
      const transport = await this.tryConnect(type);
      if (transport) {
        this.setTransport(transport);
        return;
      }
    }

    this.onStateChange({ transport: 'none', connected: false, latencyMs: 0, peerName: '' });
    this.scheduleReconnect();
  }

  private async tryConnect(type: TransportType): Promise<Transport | null> {
    // Each transport module handles its own discovery
    // USB: AOA detection, WiFi: mDNS, BLE: GATT scan
    try {
      const module = await import(`./transport/${type}Transport`);
      return await module.connect();
    } catch {
      return null;
    }
  }

  private setTransport(transport: Transport): void {
    this.transport = transport;
    transport.onMessage(this.handleIncoming.bind(this));
    this.startKeepalive();
    this.onStateChange({
      transport: transport.type,
      connected: true,
      latencyMs: 0,
      peerName: 'Desktop Agent',
    });
  }

  async sendKeyEvent(keycode: number, modifiers: number, isDown: boolean): Promise<void> {
    if (!this.transport) return;

    const payload = new ArrayBuffer(12);
    const view = new DataView(payload);
    view.setUint16(0, keycode, false);
    view.setUint8(2, modifiers);
    view.setUint8(3, isDown ? 1 : 0);
    // Microsecond timestamp (lower 32 bits sufficient for sequence)
    view.setUint32(4, Date.now() * 1000 & 0xFFFFFFFF, false);

    const packet: PKPPacket = {
      magic: PKP_MAGIC,
      version: PKP_VERSION,
      type: isDown ? PacketType.KeyDown : PacketType.KeyUp,
      seqNum: this.nextSeq(),
      payload: new Uint8Array(payload),
      crc: 0, // CRC computed in serializer
    };

    await this.transport.send(serializePacket(packet));
  }

  async sendText(text: string): Promise<void> {
    if (!this.transport) return;

    const encoded = new TextEncoder().encode(text);
    const packet: PKPPacket = {
      magic: PKP_MAGIC,
      version: PKP_VERSION,
      type: PacketType.TextInsert,
      seqNum: this.nextSeq(),
      payload: encoded,
      crc: 0,
    };

    await this.transport.send(serializePacket(packet));
  }

  private handleIncoming(data: ArrayBuffer): void {
    const view = new DataView(data);
    const type = view.getUint8(3);

    if (type === PacketType.Keepalive) {
      const sentAt = view.getUint32(10, false);
      const latencyMs = (Date.now() & 0xFFFF) - (sentAt & 0xFFFF);
      this.onStateChange({
        transport: this.transport!.type,
        connected: true,
        latencyMs: Math.abs(latencyMs),
        peerName: 'Desktop Agent',
      });
    }

    if (type === PacketType.AppContext) {
      // Let UI layer handle context change
      this.onAppContextChange(data);
    }
  }

  private onAppContextChange(_data: ArrayBuffer): void {
    // Dispatched to store for contextual shortcut bar update
  }

  private startKeepalive(): void {
    this.keepaliveTimer = setInterval(() => {
      if (!this.transport) return;
      const packet: PKPPacket = {
        magic: PKP_MAGIC,
        version: PKP_VERSION,
        type: PacketType.Keepalive,
        seqNum: this.nextSeq(),
        payload: new Uint8Array(4),
        crc: 0,
      };
      // Write timestamp into payload
      const view = new DataView(packet.payload.buffer);
      view.setUint32(0, Date.now() & 0xFFFFFFFF, false);
      this.transport.send(serializePacket(packet)).catch(() => this.handleDisconnect());
    }, 500);
  }

  private handleDisconnect(): void {
    this.transport?.disconnect();
    this.transport = null;
    if (this.keepaliveTimer) clearInterval(this.keepaliveTimer);
    this.onStateChange({ transport: 'none', connected: false, latencyMs: 0, peerName: '' });
    this.scheduleReconnect();
  }

  private scheduleReconnect(delayMs = 1000): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectBest();
    }, delayMs);
  }

  private nextSeq(): number {
    this.seqNum = (this.seqNum + 1) & 0xFFFFFFFF;
    return this.seqNum;
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.keepaliveTimer) clearInterval(this.keepaliveTimer);
    this.transport?.disconnect();
    this.transport = null;
  }
}
