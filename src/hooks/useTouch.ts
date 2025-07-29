import { useEffect, useRef, useState } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

export function useSwipe(
  onSwipe?: (direction: SwipeDirection) => void,
  minSwipeDistance = 50
) {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    let direction: SwipeDirection['direction'] = null;
    let distance = 0;

    if (isLeftSwipe) {
      direction = 'left';
      distance = Math.abs(distanceX);
    } else if (isRightSwipe) {
      direction = 'right';
      distance = Math.abs(distanceX);
    } else if (isUpSwipe) {
      direction = 'up';
      distance = Math.abs(distanceY);
    } else if (isDownSwipe) {
      direction = 'down';
      distance = Math.abs(distanceY);
    }

    if (direction && onSwipe) {
      onSwipe({ direction, distance });
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

export function useTouchHold(
  onHold: () => void,
  holdDuration = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onTouchStart = () => {
    timeoutRef.current = setTimeout(() => {
      onHold();
    }, holdDuration);
  };

  const onTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
  };
}

export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  threshold = 80
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const onTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (window.scrollY === 0 && startY.current > 0) {
      currentY.current = e.touches[0].clientY;
      const pullDistance = Math.max(0, currentY.current - startY.current);
      setPullDistance(pullDistance);

      if (pullDistance > threshold && !isRefreshing) {
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }
  };

  const onTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    startY.current = 0;
    currentY.current = 0;
  };

  return {
    isRefreshing,
    pullDistance,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Hook for detecting device capabilities
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    hasTouch: false,
    hasHover: false,
    hasPointer: false,
    isStandalone: false,
    supportsVibration: false,
  });

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const supportsVibration = 'vibrate' in navigator;

    setCapabilities({
      hasTouch,
      hasHover,
      hasPointer,
      isStandalone,
      supportsVibration,
    });
  }, []);

  return capabilities;
}