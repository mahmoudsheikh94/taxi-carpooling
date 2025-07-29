import { useState, useEffect } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileLayout({ children, className = '' }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < 768; // md breakpoint
      
      setIsMobile(mobile);
      
      if (width < 640) {
        setScreenSize('sm');
      } else if (width < 768) {
        setScreenSize('md');
      } else if (width < 1024) {
        setScreenSize('lg');
      } else {
        setScreenSize('xl');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Apply mobile-specific viewport meta tag
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content', 
        'width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover'
      );
    }
  }, []);

  // Prevent zoom on input focus (iOS Safari)
  useEffect(() => {
    if (isMobile) {
      const preventZoom = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          target.style.fontSize = '16px';
        }
      };

      document.addEventListener('focusin', preventZoom);
      return () => document.removeEventListener('focusin', preventZoom);
    }
  }, [isMobile]);

  const containerClasses = [
    'min-h-screen bg-gray-50',
    isMobile ? 'pb-safe' : '', // Safe area padding for mobile
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Mobile status bar spacer */}
      {isMobile && (
        <div className="h-safe-top bg-white border-b border-gray-200" />
      )}
      
      {/* Main content */}
      <div className={`
        ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}
        ${screenSize === 'sm' ? 'space-y-4' : 'space-y-6'}
      `}>
        {children}
      </div>
      
      {/* Mobile bottom spacer */}
      {isMobile && (
        <div className="h-safe-bottom" />
      )}
    </div>
  );
}

// Hook to detect mobile screen size
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Hook to get current screen size
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setScreenSize('sm');
      } else if (width < 768) {
        setScreenSize('md');
      } else if (width < 1024) {
        setScreenSize('lg');
      } else {
        setScreenSize('xl');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
}