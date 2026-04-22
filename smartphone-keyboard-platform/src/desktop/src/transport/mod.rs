// Transport manager — USB > WiFi > BLE priority with hot-swap.

use tokio::sync::mpsc;
use crate::protocol::{KeyEvent, PKPPacket, PacketType};

mod websocket;

pub struct TransportManager {
    key_tx: mpsc::Sender<KeyEvent>,
}

impl TransportManager {
    pub fn new(key_tx: mpsc::Sender<KeyEvent>) -> Self {
        Self { key_tx }
    }

    pub async fn start(&mut self) -> anyhow::Result<()> {
        // MVP: WiFi WebSocket only
        // Phase 1: add USB (AOA), BLE (GATT server)
        loop {
            tracing::info!("Starting WiFi WebSocket transport on :7832");

            match websocket::listen("0.0.0.0:7832", self.key_tx.clone()).await {
                Ok(()) => tracing::info!("Transport session ended, restarting..."),
                Err(e) => {
                    tracing::error!("Transport error: {}, retrying in 2s", e);
                    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                }
            }
        }
    }
}
