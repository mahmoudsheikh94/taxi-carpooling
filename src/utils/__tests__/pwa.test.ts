import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pwaManager } from '../pwa';

// Mock browser APIs
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
  addEventListener: vi.fn(),
  showNotification: vi.fn(),
  sync: {
    register: vi.fn(),
  },
};

const mockBeforeInstallPromptEvent = {
  preventDefault: vi.fn(),
  prompt: vi.fn().mockResolvedValue(undefined),
  userChoice: Promise.resolve({ outcome: 'accepted' }),
};

describe('PWA Manager', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
        controller: null,
        addEventListener: vi.fn(),
      },
    });

    // Mock window.addEventListener for PWA events
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.dispatchEvent = vi.fn();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      // The PWA manager initializes on import, so we test the registration call
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle service worker registration failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      navigator.serviceWorker.register = vi.fn().mockRejectedValue(new Error('Registration failed'));
      
      // Create new instance to trigger registration
      const { pwaManager: newPwaManager } = await import('../pwa');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'PWA: Service Worker registration failed:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Install Functionality', () => {
    it('should detect when app can be installed', () => {
      // Simulate beforeinstallprompt event
      const event = new CustomEvent('beforeinstallprompt');
      Object.assign(event, mockBeforeInstallPromptEvent);
      
      window.dispatchEvent(event);
      
      expect(pwaManager.canInstall()).toBe(true);
    });

    it('should show install prompt when available', async () => {
      // Set up a deferred prompt
      (pwaManager as any).deferredPrompt = mockBeforeInstallPromptEvent;
      
      const result = await pwaManager.showInstallPrompt();
      
      expect(mockBeforeInstallPromptEvent.prompt).toHaveBeenCalled();
      expect(result.installed).toBe(true);
      expect(result.dismissed).toBe(false);
    });

    it('should handle install prompt dismissal', async () => {
      const dismissedPrompt = {
        ...mockBeforeInstallPromptEvent,
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      };
      
      (pwaManager as any).deferredPrompt = dismissedPrompt;
      
      const result = await pwaManager.showInstallPrompt();
      
      expect(result.installed).toBe(false);
      expect(result.dismissed).toBe(true);
    });

    it('should return false when no install prompt available', async () => {
      (pwaManager as any).deferredPrompt = null;
      
      const result = await pwaManager.showInstallPrompt();
      
      expect(result.installed).toBe(false);
      expect(result.dismissed).toBe(true);
    });
  });

  describe('Installation Detection', () => {
    it('should detect standalone mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(pwaManager.isAppInstalled()).toBe(true);
    });

    it('should detect iOS standalone mode', () => {
      Object.defineProperty(navigator, 'standalone', {
        writable: true,
        value: true,
      });

      const result = (pwaManager as any).checkIfInstalled();
      expect(result).toBe(true);
    });
  });

  describe('Online/Offline Detection', () => {
    it('should detect online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(pwaManager.isOnline()).toBe(true);
    });

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(pwaManager.isOnline()).toBe(false);
    });

    it('should set up connection change listeners', () => {
      const callback = vi.fn();
      const unsubscribe = pwaManager.onConnectionChange(callback);

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

      // Test unsubscribe
      unsubscribe();
      expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Background Sync', () => {
    it('should register background sync', async () => {
      (pwaManager as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
      
      const result = await pwaManager.addToBackgroundSync('test-sync');
      
      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith('test-sync');
      expect(result).toBe(true);
    });

    it('should handle background sync failure', async () => {
      (pwaManager as any).serviceWorkerRegistration = {
        ...mockServiceWorkerRegistration,
        sync: {
          register: vi.fn().mockRejectedValue(new Error('Sync failed')),
        },
      };
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await pwaManager.addToBackgroundSync('test-sync');
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should return false when service worker not available', async () => {
      (pwaManager as any).serviceWorkerRegistration = null;
      
      const result = await pwaManager.addToBackgroundSync('test-sync');
      
      expect(result).toBe(false);
    });
  });

  describe('Notifications', () => {
    it('should request notification permission', async () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('granted'),
        },
      });

      const permission = await pwaManager.requestNotificationPermission();
      
      expect(window.Notification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should return existing permission', async () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: {
          permission: 'granted',
          requestPermission: vi.fn(),
        },
      });

      const permission = await pwaManager.requestNotificationPermission();
      
      expect(window.Notification.requestPermission).not.toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should show notification through service worker', async () => {
      (pwaManager as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
      
      const result = await pwaManager.showNotification('Test Title', {
        body: 'Test body',
      });
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test body',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [100, 50, 100],
        })
      );
      expect(result).toBe(true);
    });
  });

  describe('Web Share API', () => {
    it('should share content when API is available', async () => {
      Object.defineProperty(navigator, 'share', {
        writable: true,
        value: vi.fn().mockResolvedValue(undefined),
      });

      const shareData = {
        title: 'Test Title',
        text: 'Test Description',
        url: 'https://example.com',
      };

      const result = await pwaManager.share(shareData);
      
      expect(navigator.share).toHaveBeenCalledWith(shareData);
      expect(result).toBe(true);
    });

    it('should handle share cancellation', async () => {
      Object.defineProperty(navigator, 'share', {
        writable: true,
        value: vi.fn().mockRejectedValue(new DOMException('Abort', 'AbortError')),
      });

      const result = await pwaManager.share({ title: 'Test' });
      
      expect(result).toBe(false);
    });

    it('should return false when API not available', async () => {
      delete (navigator as any).share;
      
      const result = await pwaManager.share({ title: 'Test' });
      
      expect(result).toBe(false);
    });
  });

  describe('App Info', () => {
    it('should return comprehensive app information', () => {
      const appInfo = pwaManager.getAppInfo();
      
      expect(appInfo).toHaveProperty('isInstalled');
      expect(appInfo).toHaveProperty('canInstall');
      expect(appInfo).toHaveProperty('isOnline');
      expect(appInfo).toHaveProperty('hasServiceWorker');
      expect(appInfo).toHaveProperty('hasNotificationSupport');
      expect(appInfo).toHaveProperty('hasShareSupport');
      expect(appInfo).toHaveProperty('hasBackgroundSyncSupport');
      
      expect(typeof appInfo.isInstalled).toBe('boolean');
      expect(typeof appInfo.canInstall).toBe('boolean');
      expect(typeof appInfo.isOnline).toBe('boolean');
    });
  });
});