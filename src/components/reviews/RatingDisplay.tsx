import { StarDisplay } from './StarRating';
import type { UserRatingStats } from '../../services/supabase/reviews';

interface RatingDisplayProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  showText?: boolean;
  className?: string;
}

export function RatingDisplay({
  rating,
  count,
  size = 'sm',
  showCount = true,
  showText = false,
  className = '',
}: RatingDisplayProps) {
  if (count === 0) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <StarDisplay rating={0} size={size} showValue={false} />
        <span className="text-sm">No reviews</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <StarDisplay rating={rating} size={size} showValue={false} />
      <div className="flex items-center space-x-1">
        <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
        {showCount && (
          <span className="text-sm text-gray-500">
            ({count} review{count !== 1 ? 's' : ''})
          </span>
        )}
      </div>
      {showText && (
        <span className="text-sm text-gray-600">
          {getRatingText(rating)}
        </span>
      )}
    </div>
  );
}

// Detailed rating stats component
interface RatingStatsProps {
  stats: UserRatingStats;
  className?: string;
}

export function RatingStats({ stats, className = '' }: RatingStatsProps) {
  const { rating_average, rating_count, rating_distribution, aspect_averages } = stats;

  const distributionData = [
    { stars: 5, count: rating_distribution.five_star },
    { stars: 4, count: rating_distribution.four_star },
    { stars: 3, count: rating_distribution.three_star },
    { stars: 2, count: rating_distribution.two_star },
    { stars: 1, count: rating_distribution.one_star },
  ];

  const aspectLabels = {
    punctuality: 'Punctuality',
    communication: 'Communication',
    cleanliness: 'Cleanliness',
    driving: 'Driving Skills',
    friendliness: 'Friendliness',
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Overall Rating */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {rating_average.toFixed(1)}
          </div>
          <StarDisplay rating={rating_average} size="md" showValue={false} />
          <div className="text-sm text-gray-500 mt-1">
            {rating_count} review{rating_count !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Breakdown</h4>
          <div className="space-y-2">
            {distributionData.map(({ stars, count }) => {
              const percentage = rating_count > 0 ? (count / rating_count) * 100 : 0;
              
              return (
                <div key={stars} className="flex items-center space-x-2 text-sm">
                  <span className="w-8 text-gray-600">{stars}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Aspect Ratings */}
      {Object.keys(aspect_averages).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Ratings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(aspect_averages).map(([aspect, average]) => (
              <div key={aspect} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {aspectLabels[aspect as keyof typeof aspectLabels] || aspect}
                </span>
                <div className="flex items-center space-x-2">
                  <StarDisplay rating={average} size="sm" showValue={false} />
                  <span className="text-sm font-medium text-gray-700">
                    {average.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getRatingText(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Fair';
  if (rating >= 2.0) return 'Poor';
  return 'Very Poor';
}