import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Button, LoadingSpinner, EmptyState } from '../ui';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import type { Message } from '../../types';

interface MessageSearchProps {
  chatRoomId: string;
  onClose?: () => void;
  onMessageSelect?: (message: Message) => void;
  className?: string;
}

export function MessageSearch({
  chatRoomId,
  onClose,
  onMessageSelect,
  className = '',
}: MessageSearchProps) {
  const { user } = useAuthStore();
  const { messages, searchMessages, isLoadingMessages } = useChatStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(-1);

  const roomMessages = messages[chatRoomId] || [];

  // Local search in already loaded messages
  const localSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return roomMessages.filter(message => 
      message.content.toLowerCase().includes(query) ||
      message.sender?.name?.toLowerCase().includes(query)
    ).reverse(); // Most recent first
  }, [roomMessages, searchQuery]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        await searchMessages(chatRoomId, searchQuery);
        const searchKey = `${chatRoomId}_search`;
        const results = messages[searchKey] || [];
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, chatRoomId, searchMessages, messages]);

  // Use local results if available, otherwise use server results
  const displayResults = localSearchResults.length > 0 ? localSearchResults : searchResults;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (displayResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMessageIndex(prev => 
          prev < displayResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMessageIndex(prev => 
          prev > 0 ? prev - 1 : displayResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedMessageIndex >= 0) {
          const selectedMessage = displayResults[selectedMessageIndex];
          onMessageSelect?.(selectedMessage);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getMessagePreview = (message: Message) => {
    switch (message.message_type) {
      case 'image':
        return '📷 Image';
      case 'file':
        return '📄 File';
      case 'location':
        return '📍 Location';
      default:
        return message.content;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Search header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Search Messages</h3>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for messages..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {(isSearching || isLoadingMessages) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
        
        {searchQuery && (
          <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
            <span>
              {displayResults.length} {displayResults.length === 1 ? 'result' : 'results'} found
            </span>
            {displayResults.length > 0 && (
              <span className="text-xs">
                Use ↑↓ to navigate, Enter to select
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search results */}
      <div className="max-h-96 overflow-y-auto">
        {!searchQuery.trim() && (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>Type to search through your messages</p>
          </div>
        )}

        {searchQuery.trim() && displayResults.length === 0 && !isSearching && (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            title="No messages found"
            description={`No messages match "${searchQuery}". Try a different search term.`}
          />
        )}

        {displayResults.map((message, index) => {
          const isOwn = message.sender_id === user?.id;
          const isSelected = index === selectedMessageIndex;
          
          return (
            <div
              key={message.id}
              onClick={() => onMessageSelect?.(message)}
              className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Sender avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600">
                    {isOwn ? 'You' : (message.sender?.name?.charAt(0).toUpperCase() || 'U')}
                  </span>
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {isOwn ? 'You' : message.sender?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(message.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {message.message_type === 'text' ? (
                      <span>{highlightText(message.content, searchQuery)}</span>
                    ) : (
                      <span className="italic">{getMessagePreview(message)}</span>
                    )}
                  </div>
                  
                  {message.is_edited && (
                    <span className="text-xs text-gray-400 italic">edited</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search footer */}
      {searchQuery && displayResults.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Search in {localSearchResults.length > 0 ? 'loaded messages' : 'all messages'}
            </span>
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
              size="sm"
            >
              Clear Search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}