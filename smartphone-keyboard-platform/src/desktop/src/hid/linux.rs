// Linux HID injection via uinput kernel interface.
// Requires: /dev/uinput access (udev rule or CAP_SYS_ADMIN)

use std::fs::OpenOptions;
use std::io::Write;
use std::os::unix::fs::OpenOptionsExt;

use crate::protocol::KeyEvent;
use super::HidInjector;

// Linux input event structure (matches kernel uapi/linux/input.h)
#[repr(C)]
struct InputEvent {
    time_sec: i64,
    time_usec: i64,
    event_type: u16,
    code: u16,
    value: i32,
}

const EV_SYN: u16 = 0x00;
const EV_KEY: u16 = 0x01;
const SYN_REPORT: u16 = 0x00;

pub struct LinuxInjector {
    uinput_fd: std::fs::File,
}

impl LinuxInjector {
    pub fn new() -> anyhow::Result<Self> {
        let fd = OpenOptions::new()
            .write(true)
            .custom_flags(libc::O_NONBLOCK)
            .open("/dev/uinput")?;

        // uinput setup: enable key events and create virtual device
        // (ioctl calls omitted for brevity — use `uinput` crate in production)

        Ok(Self { uinput_fd: fd })
    }

    fn write_event(&mut self, event_type: u16, code: u16, value: i32) -> anyhow::Result<()> {
        let ev = InputEvent {
            time_sec: 0,
            time_usec: 0,
            event_type,
            code,
            value,
        };

        let bytes = unsafe {
            std::slice::from_raw_parts(
                &ev as *const InputEvent as *const u8,
                std::mem::size_of::<InputEvent>(),
            )
        };

        self.uinput_fd.write_all(bytes)?;
        Ok(())
    }
}

impl HidInjector for LinuxInjector {
    fn inject(&self, event: KeyEvent) -> anyhow::Result<()> {
        // LinuxInjector needs &mut self for write — use Mutex in production
        // Shown here as conceptual implementation

        let linux_keycode = hid_to_linux_keycode(event.keycode);
        let value = if event.is_down { 1 } else { 0 };

        // Key event
        tracing::debug!(
            "inject: keycode={} linux={} down={}",
            event.keycode, linux_keycode, event.is_down
        );

        // In production: self.write_event(EV_KEY, linux_keycode, value)?;
        //                self.write_event(EV_SYN, SYN_REPORT, 0)?;

        Ok(())
    }
}

fn hid_to_linux_keycode(hid: u16) -> u16 {
    // HID Usage ID → Linux evdev keycode mapping (partial)
    match hid {
        0x04..=0x1D => hid - 0x04 + 30, // A-Z → KEY_A (30) to KEY_Z
        0x1E..=0x26 => hid - 0x1E + 2,  // 1-9 → KEY_1 (2) to KEY_9
        0x27 => 11,                       // 0 → KEY_0
        0x28 => 28,                       // Enter → KEY_ENTER
        0x29 => 1,                        // Escape → KEY_ESC
        0x2A => 14,                       // Backspace → KEY_BACKSPACE
        0x2B => 15,                       // Tab → KEY_TAB
        0x2C => 57,                       // Space → KEY_SPACE
        0x4F => 106,                      // ArrowRight → KEY_RIGHT
        0x50 => 105,                      // ArrowLeft → KEY_LEFT
        0x51 => 108,                      // ArrowDown → KEY_DOWN
        0x52 => 103,                      // ArrowUp → KEY_UP
        0x3A..=0x45 => hid - 0x3A + 59,  // F1-F12 → KEY_F1 (59) to KEY_F12
        _ => 0,
    }
}
