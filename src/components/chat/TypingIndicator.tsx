import { useEffect, useState } from 'react';
import type { TypingStatus } from '../../services/supabase/typing';

interface TypingIndicatorProps {
  typingUsers: TypingStatus[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className = '' }: TypingIndicatorProps) {
  const [dots, setDots] = useState('');

  // Animate dots
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const userName = typingUsers[0].username || 'Someone';
      return `${userName} is typing${dots}`;
    } else if (typingUsers.length === 2) {
      const names = typingUsers.map(u => u.username || 'Someone').join(' and ');
      return `${names} are typing${dots}`;
    } else {
      return `${typingUsers.length} people are typing${dots}`;
    }
  };

  return (
    <div className={`flex items-center space-x-3 px-4 py-2 ${className}`}>
      {/* Typing avatars */}
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user, index) => (
          <div
            key={user.user_id}
            className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
            style={{ zIndex: 10 - index }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-gray-600">
                {(user.username || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
        {typingUsers.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-medium text-white">
            +{typingUsers.length - 3}
          </div>
        )}
      </div>

      {/* Typing text with animation */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">{getTypingText()}</span>
        
        {/* Animated typing dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

interface QuickTypingDotsProps {
  className?: string;
}

export function QuickTypingDots({ className = '' }: QuickTypingDotsProps) {
  return (
    <div className={`flex items-center justify-start mb-4 ${className}`}>
      <div className="max-w-xs lg:max-w-md">
        <div className="bg-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}