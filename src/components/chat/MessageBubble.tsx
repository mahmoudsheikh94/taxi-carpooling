import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '../ui';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  className?: string;
}

export function MessageBubble({
  message,
  isOwn,
  showTimestamp = false,
  onEdit,
  onDelete,
  onRetry,
  className = '',
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const getMessageStatusIcon = () => {
    if (!isOwn) return null;
    
    if (message.read_at) {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L4 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (message.delivered_at) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L4 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  };

  const renderMessageContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={handleCancelEdit}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              size="sm"
              disabled={!editContent.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      );
    }

    switch (message.message_type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.attachment_url && (
              <img
                src={message.attachment_url}
                alt="Shared image"
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.attachment_url, '_blank')}
              />
            )}
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.content || 'File attachment'}
              </p>
              {message.attachment_size && (
                <p className="text-xs text-gray-500">
                  {(message.attachment_size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
            {message.attachment_url && (
              <a
                href={message.attachment_url}
                download
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </a>
            )}
          </div>
        );
      
      case 'location':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="text-sm">{message.content}</p>
          </div>
        );
      
      case 'system':
        return (
          <div className="flex items-center justify-center">
            <p className="text-xs text-gray-500 italic">{message.content}</p>
          </div>
        );
      
      default:
        return (
          <div className="space-y-1">
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {message.is_edited && (
              <p className="text-xs text-gray-400 italic">edited</p>
            )}
          </div>
        );
    }
  };

  if (message.message_type === 'system') {
    return (
      <div className={`flex justify-center my-4 ${className}`}>
        <div className="bg-gray-100 px-3 py-1 rounded-full">
          {renderMessageContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 ${className}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-200 text-gray-900 rounded-bl-md'
          }`}
        >
          {renderMessageContent()}
          
          {/* Message metadata */}
          <div className={`flex items-center justify-between mt-2 space-x-2 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <div className="flex items-center space-x-1 text-xs">
              <span>
                {showTimestamp 
                  ? format(new Date(message.created_at), 'MMM d, h:mm a')
                  : format(new Date(message.created_at), 'h:mm a')
                }
              </span>
              {message.is_edited && !isEditing && (
                <span className="italic">(edited)</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {getMessageStatusIcon()}
            </div>
          </div>
        </div>

        {/* Sender info for received messages */}
        {!isOwn && message.sender && (
          <div className="flex items-center space-x-2 mt-1 ml-2">
            <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {message.sender.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-gray-500">{message.sender.name}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && isOwn && !isEditing && (
        <div className={`flex items-start space-x-1 mt-2 ${isOwn ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
          {onEdit && message.message_type === 'text' && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Edit message"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Delete message"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Retry button for failed messages */}
      {onRetry && !message.delivered_at && isOwn && (
        <div className="flex items-start mt-2 order-1 mr-2">
          <button
            onClick={() => onRetry(message.id)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Retry sending"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}