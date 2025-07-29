// PWA utilities for installation and service worker management

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Check if already installed
    this.isInstalled = this.checkIfInstalled();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.dispatchCustomEvent('pwa-installable', { canInstall: true });
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.dispatchCustomEvent('pwa-installed', { installed: true });
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully');
        
        // Listen for updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
      }
    }
  }

  // Check if the app is already installed
  private checkIfInstalled(): boolean {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Check for iOS Safari standalone mode
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    return false;
  }

  // Show install prompt
  async showInstallPrompt(): Promise<{ installed: boolean; dismissed: boolean }> {
    if (!this.deferredPrompt) {
      return { installed: false, dismissed: true };
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      this.deferredPrompt = null;
      
      if (choiceResult.outcome === 'accepted') {
        return { installed: true, dismissed: false };
      } else {
        return { installed: false, dismissed: true };
      }
    } catch (error) {
      console.error('PWA: Install prompt failed:', error);
      return { installed: false, dismissed: true };
    }
  }

  // Check if install prompt is available
  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  // Check if app is installed
  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  // Handle service worker updates
  private handleServiceWorkerUpdate() {
    if (!this.serviceWorkerRegistration) return;

    const newWorker = this.serviceWorkerRegistration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New update available
        this.dispatchCustomEvent('pwa-update-available', { 
          newWorker,
          registration: this.serviceWorkerRegistration 
        });
      }
    });
  }

  // Apply service worker update
  async applyUpdate(): Promise<void> {
    if (!this.serviceWorkerRegistration) return;

    const newWorker = this.serviceWorkerRegistration.waiting;
    if (!newWorker) return;

    // Tell the waiting service worker to become active
    newWorker.postMessage({ type: 'SKIP_WAITING' });

    // Wait for the new service worker to take control
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve();
      });
    });

    // Reload the page to apply updates
    window.location.reload();
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersistent = await navigator.storage.persist();
        console.log('PWA: Persistent storage:', isPersistent);
        return isPersistent;
      } catch (error) {
        console.error('PWA: Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  }

  // Get storage estimate
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return estimate;
      } catch (error) {
        console.error('PWA: Storage estimate failed:', error);
        return null;
      }
    }
    return null;
  }

  // Check if app is running online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Listen for online/offline events
  onConnectionChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // Share content using Web Share API
  async share(data: ShareData): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('PWA: Web Share failed:', error);
        }
        return false;
      }
    }
    return false;
  }

  // Add to background sync
  async addToBackgroundSync(tag: string, data?: any): Promise<boolean> {
    if (!this.serviceWorkerRegistration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      return false;
    }

    try {
      // Store data for background sync if provided
      if (data) {
        await this.storeForBackgroundSync(tag, data);
      }

      await this.serviceWorkerRegistration.sync.register(tag);
      return true;
    } catch (error) {
      console.error('PWA: Background sync registration failed:', error);
      return false;
    }
  }

  // Store data for background sync (would typically use IndexedDB)
  private async storeForBackgroundSync(tag: string, data: any): Promise<void> {
    // This is a simplified implementation
    // In a real app, you'd use IndexedDB for reliable storage
    const key = `pwa-sync-${tag}-${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('PWA: Notification permission request failed:', error);
      return 'denied';
    }
  }

  // Show local notification
  async showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      await this.serviceWorkerRegistration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        ...options,
      });
      return true;
    } catch (error) {
      console.error('PWA: Show notification failed:', error);
      return false;
    }
  }

  // Dispatch custom events
  private dispatchCustomEvent(type: string, detail: any) {
    const event = new CustomEvent(type, { detail });
    window.dispatchEvent(event);
  }

  // Get app info
  getAppInfo() {
    return {
      isInstalled: this.isInstalled,
      canInstall: this.canInstall(),
      isOnline: this.isOnline(),
      hasServiceWorker: !!this.serviceWorkerRegistration,
      hasNotificationSupport: 'Notification' in window,
      hasShareSupport: 'share' in navigator,
      hasBackgroundSyncSupport: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    };
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Utility functions for easier use
export const installApp = () => pwaManager.showInstallPrompt();
export const canInstallApp = () => pwaManager.canInstall();
export const isAppInstalled = () => pwaManager.isAppInstalled();
export const applyPWAUpdate = () => pwaManager.applyUpdate();
export const isOnline = () => pwaManager.isOnline();
export const shareContent = (data: ShareData) => pwaManager.share(data);
export const addToBackgroundSync = (tag: string, data?: any) => pwaManager.addToBackgroundSync(tag, data);
export const requestNotificationPermission = () => pwaManager.requestNotificationPermission();
export const showNotification = (title: string, options?: NotificationOptions) => pwaManager.showNotification(title, options);

// PWA event types for TypeScript
declare global {
  interface WindowEventMap {
    'pwa-installable': CustomEvent<{ canInstall: boolean }>;
    'pwa-installed': CustomEvent<{ installed: boolean }>;
    'pwa-update-available': CustomEvent<{ newWorker: ServiceWorker; registration: ServiceWorkerRegistration }>;
  }
}