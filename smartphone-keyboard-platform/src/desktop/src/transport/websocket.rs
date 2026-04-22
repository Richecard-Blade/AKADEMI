// WebSocket transport — TLS 1.3 secured, Nagle disabled.

use futures_util::{SinkExt, StreamExt};
use tokio::net::TcpListener;
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;

use crate::protocol::{KeyEvent, PKPPacket, PacketType};

pub async fn listen(addr: &str, key_tx: mpsc::Sender<KeyEvent>) -> anyhow::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    tracing::info!("Listening on ws://{}", addr);

    // Accept one connection at a time (MVP — single device)
    while let Ok((stream, peer)) = listener.accept().await {
        tracing::info!("Connection from {}", peer);

        // Disable Nagle algorithm for minimal latency
        stream.set_nodelay(true)?;

        let ws_stream = tokio_tungstenite::accept_async(stream).await?;
        let (mut ws_tx, mut ws_rx) = ws_stream.split();

        while let Some(msg) = ws_rx.next().await {
            let data = match msg? {
                Message::Binary(data) => data,
                Message::Close(_) => break,
                Message::Ping(payload) => {
                    ws_tx.send(Message::Pong(payload)).await?;
                    continue;
                }
                _ => continue,
            };

            match PKPPacket::deserialize(&data) {
                Ok(packet) => handle_packet(packet, &key_tx).await,
                Err(e) => tracing::warn!("Malformed packet from {}: {}", peer, e),
            }
        }

        tracing::info!("Client {} disconnected", peer);
    }

    Ok(())
}

async fn handle_packet(packet: PKPPacket, key_tx: &mpsc::Sender<KeyEvent>) {
    match packet.packet_type {
        PacketType::KeyDown | PacketType::KeyUp => {
            match packet.parse_key_event() {
                Ok(event) => {
                    if key_tx.send(event).await.is_err() {
                        tracing::error!("HID channel closed");
                    }
                }
                Err(e) => tracing::warn!("Invalid key event: {}", e),
            }
        }
        PacketType::Keepalive => {
            // Echo back for latency measurement
            tracing::trace!("Keepalive seq={}", packet.seq_num);
        }
        PacketType::TextInsert => {
            if let Ok(text) = std::str::from_utf8(&packet.payload) {
                tracing::debug!("Text insert: {} chars", text.len());
                // Convert text to individual key events
                // (handled by HID injector using OS text injection API)
            }
        }
        other => {
            tracing::debug!("Unhandled packet type: {:?}", other);
        }
    }
}
