// PhoneKey Protocol — Rust implementation of PKP v1.

pub const PKP_MAGIC: u16 = 0x504b;
pub const PKP_VERSION: u8 = 0x01;

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PacketType {
    Handshake   = 0x01,
    Keepalive   = 0x02,
    Disconnect  = 0x03,
    KeyDown     = 0x10,
    KeyUp       = 0x11,
    KeyCombo    = 0x12,
    TextInsert  = 0x20,
    ClipboardSet = 0x30,
    ClipboardGet = 0x31,
    MediaKey    = 0x40,
    SpecialKey  = 0x41,
    ProfileSync = 0x50,
    AppContext  = 0x60,
}

impl TryFrom<u8> for PacketType {
    type Error = anyhow::Error;

    fn try_from(v: u8) -> anyhow::Result<Self> {
        match v {
            0x01 => Ok(Self::Handshake),
            0x02 => Ok(Self::Keepalive),
            0x03 => Ok(Self::Disconnect),
            0x10 => Ok(Self::KeyDown),
            0x11 => Ok(Self::KeyUp),
            0x12 => Ok(Self::KeyCombo),
            0x20 => Ok(Self::TextInsert),
            0x30 => Ok(Self::ClipboardSet),
            0x31 => Ok(Self::ClipboardGet),
            0x40 => Ok(Self::MediaKey),
            0x41 => Ok(Self::SpecialKey),
            0x50 => Ok(Self::ProfileSync),
            0x60 => Ok(Self::AppContext),
            other => anyhow::bail!("Unknown packet type: 0x{:02x}", other),
        }
    }
}

#[derive(Debug, Clone)]
pub struct PKPPacket {
    pub magic: u16,
    pub version: u8,
    pub packet_type: PacketType,
    pub seq_num: u32,
    pub payload: Vec<u8>,
    pub crc: u32,
}

#[derive(Debug, Clone)]
pub struct KeyEvent {
    pub keycode: u16,
    pub modifiers: u8,
    pub is_down: bool,
    pub timestamp_us: u64,
}

impl PKPPacket {
    pub fn deserialize(buf: &[u8]) -> anyhow::Result<Self> {
        if buf.len() < 14 {
            anyhow::bail!("Buffer too short: {} bytes", buf.len());
        }

        let magic = u16::from_be_bytes([buf[0], buf[1]]);
        if magic != PKP_MAGIC {
            anyhow::bail!("Invalid magic: 0x{:04x}", magic);
        }

        let version = buf[2];
        let packet_type = PacketType::try_from(buf[3])?;
        let seq_num = u32::from_be_bytes([buf[4], buf[5], buf[6], buf[7]]);
        let payload_len = u16::from_be_bytes([buf[8], buf[9]]) as usize;

        if buf.len() < 14 + payload_len {
            anyhow::bail!("Buffer too short for payload");
        }

        let payload = buf[10..10 + payload_len].to_vec();
        let crc = u32::from_be_bytes([
            buf[10 + payload_len],
            buf[11 + payload_len],
            buf[12 + payload_len],
            buf[13 + payload_len],
        ]);

        Ok(Self { magic, version, packet_type, seq_num, payload, crc })
    }

    pub fn parse_key_event(&self) -> anyhow::Result<KeyEvent> {
        if self.payload.len() < 8 {
            anyhow::bail!("Payload too short for KeyEvent");
        }

        let keycode = u16::from_be_bytes([self.payload[0], self.payload[1]]);
        let modifiers = self.payload[2];
        let is_down = self.packet_type == PacketType::KeyDown;
        let timestamp_us = u64::from_be_bytes([
            self.payload[4], self.payload[5], self.payload[6], self.payload[7],
            0, 0, 0, 0,
        ]);

        Ok(KeyEvent { keycode, modifiers, is_down, timestamp_us })
    }
}
