import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/supabase/chat';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import type { Message, MessageStatus } from '../types';

export interface UseMessageStatusOptions {
  autoMarkAsRead?: boolean;
  batchSize?: number;
  debounceMs?: number;
  enableNotifications?: boolean;
}

export function useMessageStatus(
  chatRoomId: string, 
  options: UseMessageStatusOptions = {}
) {
  const {
    autoMarkAsRead = true,
    batchSize = 10,
    debounceMs = 1000,
    enableNotifications = false,
  } = options;

  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [messageStatuses, setMessageStatuses] = useState<Record<string, MessageStatus>>({});
  const [pendingReads, setPendingReads] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Subscribe to message status updates
  useEffect(() => {
    if (!chatRoomId) return;

    const unsubscribe = chatService.subscribeToMessageStatus(
      chatRoomId,
      (message) => {
        setMessageStatuses(prev => ({
          ...prev,
          [message.id]: {
            messageId: message.id,
            status: message.read_at ? 'read' : message.delivered_at ? 'delivered' : 'sent',
            deliveredAt: message.delivered_at ? new Date(message.delivered_at) : undefined,
            readAt: message.read_at ? new Date(message.read_at) : undefined,
          }
        }));
        setError(null);
      },
      (err) => {
        setError(err.message);
        if (enableNotifications) {
          showToast('Failed to load message status', 'error');
        }
      }
    );

    subscriptionRef.current = unsubscribe;
    return unsubscribe;
  }, [chatRoomId, enableNotifications, showToast]);

  // Mark messages as delivered when they arrive
  const markAsDelivered = useCallback(async (messageIds: string[]) => {
    if (!user?.id || messageIds.length === 0) return;

    try {
      await chatService.markMessagesAsDelivered(messageIds, user.id);
      
      // Update local status
      setMessageStatuses(prev => {
        const updated = { ...prev };
        messageIds.forEach(id => {
          if (updated[id] && updated[id].status === 'sent') {
            updated[id] = {
              ...updated[id],
              status: 'delivered',
              deliveredAt: new Date(),
            };
          }
        });
        return updated;
      });
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark messages as delivered';
      setError(errorMessage);
    }
  }, [user?.id]);

  // Mark messages as read with batching and debouncing
  const markAsRead = useCallback(async (messageIds: string[], immediate = false) => {
    if (!user?.id || messageIds.length === 0) return;

    // Add to pending reads
    setPendingReads(prev => {
      const newPending = new Set(prev);
      messageIds.forEach(id => newPending.add(id));
      return newPending;
    });

    const processReads = async () => {
      const currentPending = Array.from(pendingReads);
      if (currentPending.length === 0) return;

      try {
        // Process in batches
        const batches = [];
        for (let i = 0; i < currentPending.length; i += batchSize) {
          batches.push(currentPending.slice(i, i + batchSize));
        }

        await Promise.all(
          batches.map(batch => chatService.markMessagesAsRead(batch, user.id))
        );

        // Update local status
        setMessageStatuses(prev => {
          const updated = { ...prev };
          currentPending.forEach(id => {
            if (updated[id]) {
              updated[id] = {
                ...updated[id],
                status: 'read',
                readAt: new Date(),
              };
            }
          });
          return updated;
        });

        // Clear pending reads
        setPendingReads(new Set());
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to mark messages as read';
        setError(errorMessage);
        
        if (enableNotifications) {
          showToast('Failed to mark messages as read', 'error');
        }
      }
    };

    if (immediate) {
      await processReads();
    } else {
      // Debounce the read marking
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(processReads, debounceMs);
    }
  }, [user?.id, batchSize, debounceMs, enableNotifications, showToast, pendingReads]);

  // Auto-mark messages as read when they come into view
  const handleMessageVisible = useCallback((messages: Message[]) => {
    if (!autoMarkAsRead || !user?.id) return;

    const unreadMessages = messages
      .filter(msg => 
        msg.user_id !== user.id && 
        !msg.read_at &&
        !pendingReads.has(msg.id)
      )
      .map(msg => msg.id);

    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages);
    }
  }, [autoMarkAsRead, user?.id, markAsRead, pendingReads]);

  // Get status for a specific message
  const getMessageStatus = useCallback((messageId: string): MessageStatus | null => {
    return messageStatuses[messageId] || null;
  }, [messageStatuses]);

  // Get status icon component props
  const getStatusIcon = useCallback((messageId: string) => {
    const status = getMessageStatus(messageId);
    if (!status) return { icon: 'sent', color: 'gray' };

    switch (status.status) {
      case 'read':
        return { icon: 'double-check', color: 'blue' };
      case 'delivered':
        return { icon: 'double-check', color: 'gray' };
      case 'sent':
      default:
        return { icon: 'check', color: 'gray' };
    }
  }, [getMessageStatus]);

  // Bulk operations
  const markAllAsRead = useCallback(async (messages: Message[]) => {
    const unreadIds = messages
      .filter(msg => msg.user_id !== user?.id && !msg.read_at)
      .map(msg => msg.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds, true);
    }
  }, [user?.id, markAsRead]);

  const markAllAsDelivered = useCallback(async (messages: Message[]) => {
    const undeliveredIds = messages
      .filter(msg => msg.user_id !== user?.id && !msg.delivered_at)
      .map(msg => msg.id);
    
    if (undeliveredIds.length > 0) {
      await markAsDelivered(undeliveredIds);
    }
  }, [user?.id, markAsDelivered]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }
    setPendingReads(new Set());
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    messageStatuses,
    pendingReads: Array.from(pendingReads),
    error,
    
    // Actions
    markAsRead,
    markAsDelivered,
    markAllAsRead,
    markAllAsDelivered,
    handleMessageVisible,
    cleanup,
    
    // Getters
    getMessageStatus,
    getStatusIcon,
    
    // Computed
    hasPendingReads: pendingReads.size > 0,
    totalStatuses: Object.keys(messageStatuses).length,
  };
}

// Hook for tracking message visibility in chat window
export function useMessageVisibility(
  messages: Message[],
  onVisible?: (messages: Message[]) => void
) {
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver>();
  const messageElementsRef = useRef<Map<string, HTMLElement>>(new Map());

  // Setup intersection observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const newlyVisible: Message[] = [];
        
        setVisibleMessages(prev => {
          const updated = new Set(prev);
          
          entries.forEach(entry => {
            const messageId = entry.target.getAttribute('data-message-id');
            if (!messageId) return;
            
            if (entry.isIntersecting) {
              if (!updated.has(messageId)) {
                const message = messages.find(m => m.id === messageId);
                if (message) newlyVisible.push(message);
              }
              updated.add(messageId);
            } else {
              updated.delete(messageId);
            }
          });
          
          return updated;
        });
        
        if (newlyVisible.length > 0 && onVisible) {
          onVisible(newlyVisible);
        }
      },
      {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, onVisible]);

  // Register message element for observation
  const registerMessage = useCallback((messageId: string, element: HTMLElement | null) => {
    if (!element || !observerRef.current) return;

    const prevElement = messageElementsRef.current.get(messageId);
    if (prevElement) {
      observerRef.current.unobserve(prevElement);
    }

    messageElementsRef.current.set(messageId, element);
    element.setAttribute('data-message-id', messageId);
    observerRef.current.observe(element);
  }, []);

  // Unregister message element
  const unregisterMessage = useCallback((messageId: string) => {
    const element = messageElementsRef.current.get(messageId);
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
      messageElementsRef.current.delete(messageId);
    }
  }, []);

  return {
    visibleMessages: Array.from(visibleMessages),
    registerMessage,
    unregisterMessage,
    isVisible: (messageId: string) => visibleMessages.has(messageId),
  };
}