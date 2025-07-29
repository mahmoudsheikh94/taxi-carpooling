import { useState, useEffect, useCallback, useRef } from 'react';
import { typingStatusService } from '../services/supabase/typing';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import type { TypingStatus } from '../types';

export interface UseTypingOptions {
  debounceMs?: number;
  autoStopMs?: number;
  enableNotifications?: boolean;
}

export function useTyping(chatRoomId: string, options: UseTypingOptions = {}) {
  const {
    debounceMs = 300,
    autoStopMs = 3000,
    enableNotifications = false,
  } = options;

  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const autoStopTimerRef = useRef<NodeJS.Timeout>();
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Subscribe to typing status updates
  useEffect(() => {
    if (!chatRoomId) return;

    const unsubscribe = typingStatusService.subscribeToTypingStatus(
      chatRoomId,
      (typingStatus) => {
        setTypingUsers(prev => {
          // Remove existing status for this user
          const filtered = prev.filter(t => t.user_id !== typingStatus.user_id);
          
          // Add new status if user is typing
          if (typingStatus.is_typing) {
            return [...filtered, typingStatus];
          }
          
          return filtered;
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
        if (enableNotifications) {
          showToast('Failed to load typing status', 'error');
        }
      }
    );

    subscriptionRef.current = unsubscribe;
    return unsubscribe;
  }, [chatRoomId, enableNotifications, showToast]);

  // Auto-stop typing after inactivity
  useEffect(() => {
    if (isTyping) {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }

      autoStopTimerRef.current = setTimeout(() => {
        stopTyping();
      }, autoStopMs);
    }

    return () => {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, [isTyping, autoStopMs]);

  const startTyping = useCallback(async () => {
    if (!user?.id || isTyping) return;

    try {
      await typingStatusService.setTypingStatus(chatRoomId, user.id, true);
      setIsTyping(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set typing status';
      setError(errorMessage);
      
      if (enableNotifications) {
        showToast('Failed to update typing status', 'error');
      }
    }
  }, [user?.id, chatRoomId, isTyping, enableNotifications, showToast]);

  const stopTyping = useCallback(async () => {
    if (!user?.id || !isTyping) return;

    try {
      await typingStatusService.setTypingStatus(chatRoomId, user.id, false);
      setIsTyping(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear typing status';
      setError(errorMessage);
      
      if (enableNotifications) {
        showToast('Failed to update typing status', 'error');
      }
    }
  }, [user?.id, chatRoomId, isTyping, enableNotifications, showToast]);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      startTyping();
    }

    // Debounce to avoid too many API calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (isTyping) {
        stopTyping();
      }
    }, debounceMs);
  }, [isTyping, startTyping, stopTyping, debounceMs]);

  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
    }
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }
    if (isTyping && user?.id) {
      // Fire and forget - don't wait for response during cleanup
      typingStatusService.setTypingStatus(chatRoomId, user.id, false).catch(() => {});
    }
  }, [isTyping, user?.id, chatRoomId]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Filter out current user from typing users list
  const otherTypingUsers = typingUsers.filter(t => t.user_id !== user?.id);

  return {
    // State
    typingUsers: otherTypingUsers,
    isTyping,
    error,
    
    // Actions
    startTyping,
    stopTyping,
    handleTyping,
    cleanup,
    
    // Computed
    hasTypingUsers: otherTypingUsers.length > 0,
    typingUserNames: otherTypingUsers.map(u => u.user?.name || 'Someone').slice(0, 3),
  };
}

// Hook for managing typing in message input
export function useTypingInput(chatRoomId: string, options: UseTypingOptions = {}) {
  const typing = useTyping(chatRoomId, options);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const lastValueRef = useRef('');

  const handleInputChange = useCallback((value: string) => {
    const trimmedValue = value.trim();
    const lastValue = lastValueRef.current.trim();

    // Start typing when user starts typing (non-empty content)
    if (trimmedValue && !lastValue) {
      typing.startTyping();
    }
    // Continue typing indicator while user is actively typing
    else if (trimmedValue && trimmedValue !== lastValue) {
      typing.handleTyping();
    }
    // Stop typing when input becomes empty
    else if (!trimmedValue && lastValue) {
      typing.stopTyping();
    }

    lastValueRef.current = value;
  }, [typing]);

  const handleInputFocus = useCallback(() => {
    if (inputRef.current?.value?.trim()) {
      typing.startTyping();
    }
  }, [typing]);

  const handleInputBlur = useCallback(() => {
    typing.stopTyping();
  }, [typing]);

  const handleMessageSent = useCallback(() => {
    typing.stopTyping();
    lastValueRef.current = '';
  }, [typing]);

  return {
    ...typing,
    inputRef,
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleMessageSent,
  };
}