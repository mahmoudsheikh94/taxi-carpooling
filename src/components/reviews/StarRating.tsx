import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  disabled?: boolean;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRate,
  size = 'md',
  readonly = false,
  disabled = false,
  showValue = false,
  className = '',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starSize = sizeClasses[size];
  const isInteractive = !readonly && !disabled && onRate;

  const handleClick = (newRating: number) => {
    if (isInteractive) {
      onRate(newRating);
    }
  };

  const handleMouseEnter = (newRating: number) => {
    if (isInteractive) {
      setHoverRating(newRating);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHalfFilled = star - 0.5 <= displayRating && star > displayRating;

          return (
            <button
              key={star}
              type="button"
              className={`${starSize} ${
                isInteractive
                  ? 'cursor-pointer transition-transform hover:scale-110'
                  : 'cursor-default'
              } ${disabled ? 'opacity-50' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded`}
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <svg
                className={`${starSize} ${
                  isFilled
                    ? 'text-yellow-400'
                    : isHalfFilled
                    ? 'text-yellow-400'
                    : hoverRating && star <= hoverRating
                    ? 'text-yellow-300'
                    : 'text-gray-300'
                } transition-colors duration-150`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm text-gray-600 ml-2">
          {rating > 0 ? `${rating}/5` : 'No rating'}
        </span>
      )}
    </div>
  );
}

// Simplified star display component for showing ratings without interaction
interface StarDisplayProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function StarDisplay({
  rating,
  size = 'sm',
  showValue = true,
  className = '',
}: StarDisplayProps) {
  return (
    <StarRating
      rating={rating}
      size={size}
      readonly
      showValue={showValue}
      className={className}
    />
  );
}