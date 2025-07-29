import { StarRating } from './StarRating';

interface AspectRatingProps {
  label: string;
  rating: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
  className?: string;
}

export function AspectRating({
  label,
  rating,
  onRate,
  disabled = false,
  className = '',
}: AspectRatingProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <label className="text-sm font-medium text-gray-700 flex-1">
        {label}
      </label>
      <StarRating
        rating={rating}
        onRate={onRate}
        size="sm"
        disabled={disabled}
      />
    </div>
  );
}

// Component for displaying aspect ratings (read-only)
interface AspectDisplayProps {
  aspects: Record<string, number>;
  className?: string;
}

export function AspectDisplay({ aspects, className = '' }: AspectDisplayProps) {
  const aspectLabels = {
    punctuality: 'Punctuality',
    communication: 'Communication',
    cleanliness: 'Cleanliness',
    driving: 'Driving Skills',
    friendliness: 'Friendliness',
  };

  const validAspects = Object.entries(aspects).filter(([_, rating]) => rating > 0);

  if (validAspects.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">Detailed Ratings</h4>
      <div className="space-y-1">
        {validAspects.map(([aspect, rating]) => (
          <div key={aspect} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {aspectLabels[aspect as keyof typeof aspectLabels] || aspect}
            </span>
            <StarRating
              rating={rating}
              size="sm"
              readonly
            />
          </div>
        ))}
      </div>
    </div>
  );
}