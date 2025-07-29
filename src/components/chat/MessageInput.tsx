import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface MessageInputProps {
  chatRoomId: string;
  onSend?: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  chatRoomId,
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
  className = '',
}: MessageInputProps) {
  const { user } = useAuthStore();
  const { sendMessage, setTypingStatus, isSending } = useChatStore();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle typing status
  useEffect(() => {
    if (!user?.id) return;

    if (message.trim() && !isTyping) {
      setIsTyping(true);
      setTypingStatus(chatRoomId, user.id, true);
      onTyping?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing status
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        setTypingStatus(chatRoomId, user.id, false);
        onTyping?.(false);
      }
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, chatRoomId, user?.id, setTypingStatus, onTyping]);

  // Stop typing when component unmounts
  useEffect(() => {
    return () => {
      if (user?.id && isTyping) {
        setTypingStatus(chatRoomId, user.id, false);
      }
    };
  }, []);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !user?.id || isSending) return;

    // Clear message immediately for better UX
    const messageToSend = trimmedMessage;
    setMessage('');

    // Stop typing status
    if (isTyping) {
      setIsTyping(false);
      setTypingStatus(chatRoomId, user.id, false);
      onTyping?.(false);
    }

    try {
      // Create optimistic message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        chat_room_id: chatRoomId,
        sender_id: user.id,
        content: messageToSend,
        message_type: 'text' as const,
        is_edited: false,
        delivered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
      };

      // Add optimistic message to UI
      // (This would be handled by the parent component or store)
      
      // Send message via store
      await sendMessage(chatRoomId, messageToSend);
      onSend?.(messageToSend);
    } catch (error) {
      // Restore message on error
      setMessage(messageToSend);
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = () => {
    // This will be implemented in the FileUpload component
    console.log('File upload clicked');
  };

  const handleEmojiClick = () => {
    // This could be expanded with an emoji picker
    const emojis = ['😀', '😂', '❤️', '👍', '👎', '😍', '🚗', '📍'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setMessage(prev => prev + randomEmoji);
    textareaRef.current?.focus();
  };

  return (
    <div className={`border-t border-gray-200 bg-white p-4 ${className}`}>
      <div className="flex items-end space-x-3">
        {/* File upload button */}
        <button
          onClick={handleFileUpload}
          disabled={disabled}
          className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          {/* Emoji button inside textarea */}
          <button
            onClick={handleEmojiClick}
            disabled={disabled}
            className="absolute right-3 bottom-2 p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add emoji"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isSending}
          size="sm"
          className="flex-shrink-0 rounded-full px-4 py-2"
        >
          {isSending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </Button>
      </div>

      {/* Character count (optional) */}
      {message.length > 800 && (
        <div className="flex justify-end mt-2">
          <span className={`text-xs ${message.length > 1000 ? 'text-red-500' : 'text-gray-500'}`}>
            {message.length}/1000
          </span>
        </div>
      )}
    </div>
  );
}