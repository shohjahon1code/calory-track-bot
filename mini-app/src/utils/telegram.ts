import WebApp from "@twa-dev/sdk";

class TelegramService {
  public webApp = WebApp;

  constructor() {
    this.webApp.ready();
    this.webApp.expand();
  }

  getUser() {
    return this.webApp.initDataUnsafe?.user;
  }

  getUserId(): string {
    const initDataUnsafe = this.webApp.initDataUnsafe;
    const userId = initDataUnsafe?.user?.id?.toString();

    // Mock ID for development if real ID is missing
    if (!userId && import.meta.env.DEV) {
      console.log("⚠️ Using mock user ID for development");
      return "2062187869"; // Your actual ID from logs
    }

    return userId || "";
  }

  getTheme() {
    return this.webApp.colorScheme;
  }

  close() {
    this.webApp.close();
  }

  // Check if showPopup is supported (requires version 6.2+)
  private isPopupSupported(): boolean {
    const version = this.webApp.version;
    if (!version) return false;
    const [major, minor] = version.split(".").map(Number);
    return major > 6 || (major === 6 && minor >= 2);
  }

  showAlert(message: string) {
    if (this.isPopupSupported()) {
      try {
        this.webApp.showAlert(message);
      } catch {
        // Fallback to console log if showAlert fails
        console.log("Alert:", message);
      }
    } else {
      // Use browser alert as fallback for unsupported versions
      console.log("Alert:", message);
    }
  }

  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isPopupSupported()) {
        try {
          this.webApp.showConfirm(message, resolve);
        } catch {
          resolve(window.confirm(message));
        }
      } else {
        resolve(window.confirm(message));
      }
    });
  }

  openLink(url: string) {
    if (this.webApp.openLink) {
      this.webApp.openLink(url);
    } else {
      window.open(url, "_blank");
    }
  }
}

export default new TelegramService();
