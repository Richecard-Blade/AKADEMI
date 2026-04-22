// PhoneKey Desktop Agent — Entry point
// Manages transport connections and HID injection.

use std::sync::Arc;
use tokio::sync::mpsc;

mod hid;
mod protocol;
mod transport;
mod pairing;

use protocol::KeyEvent;
use transport::TransportManager;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    tracing::info!("PhoneKey Desktop Agent v0.1.0 starting");

    let (key_tx, mut key_rx) = mpsc::channel::<KeyEvent>(256);

    // Start HID injector on dedicated high-priority thread
    let injector = Arc::new(hid::create_injector()?);
    let injector_clone = injector.clone();

    tokio::spawn(async move {
        while let Some(event) = key_rx.recv().await {
            if let Err(e) = injector_clone.inject(event) {
                tracing::error!("HID injection failed: {}", e);
            }
        }
    });

    // Start transport manager (USB > WiFi > BLE)
    let mut manager = TransportManager::new(key_tx);
    manager.start().await?;

    Ok(())
}
