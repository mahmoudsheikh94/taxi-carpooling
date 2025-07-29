import { formatDistanceToNow } from 'date-fns';
import { Card } from '../ui';
import { StarDisplay } from './StarRating';
import { AspectDisplay } from './AspectRating';
import type { Review } from '../../types';

interface ReviewCardProps {
  review: Review;
  showTrip?: boolean;
  showReviewer?: boolean;
  className?: string;
}

export function ReviewCard({ 
  review, 
  showTrip = false, 
  showReviewer = true, 
  className = '' 
}: ReviewCardProps) {
  const reviewer = review.is_anonymous ? null : review.reviewer;
  const reviewedUser = review.reviewed_user;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Reviewer Info */}
            {showReviewer && (
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  {reviewer ? (
                    <span className="text-sm font-medium text-gray-600">
                      {reviewer.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  ) : (
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {reviewer ? reviewer.name : 'Anonymous'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            )}

            {/* Trip Info */}
            {showTrip && review.trip && (
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Trip:</span> {review.trip.origin} → {review.trip.destination}
              </div>
            )}

            {/* Reviewed User */}
            {!showReviewer && reviewedUser && (
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {reviewedUser.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Review for {reviewedUser.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <StarDisplay rating={review.rating} size="sm" showValue={false} />
            <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <div className="text-gray-700">
            <p className="leading-relaxed">{review.comment}</p>
          </div>
        )}

        {/* Aspect Ratings */}
        {review.aspects && Object.keys(review.aspects).length > 0 && (
          <AspectDisplay aspects={review.aspects} />
        )}

        {/* Verification Badge */}
        {review.trip && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Verified trip review</span>
          </div>
        )}

        {/* Anonymous Badge */}
        {review.is_anonymous && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Anonymous review</span>
          </div>
        )}
      </div>
    </Card>
  );
}