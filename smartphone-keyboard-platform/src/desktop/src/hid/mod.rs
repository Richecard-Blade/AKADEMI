// HID injection — platform-specific implementations.
// Selects the right backend at compile time.

use crate::protocol::KeyEvent;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

pub trait HidInjector: Send + Sync {
    fn inject(&self, event: KeyEvent) -> anyhow::Result<()>;
}

pub fn create_injector() -> anyhow::Result<Box<dyn HidInjector>> {
    #[cfg(target_os = "linux")]
    return Ok(Box::new(linux::LinuxInjector::new()?));

    #[cfg(target_os = "macos")]
    return Ok(Box::new(macos::MacosInjector::new()?));

    #[cfg(target_os = "windows")]
    return Ok(Box::new(windows::WindowsInjector::new()?));

    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    anyhow::bail!("Unsupported platform");
}
