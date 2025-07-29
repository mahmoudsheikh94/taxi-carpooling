import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextArea } from '../ui';
import { StarRating } from './StarRating';
import { AspectRating } from './AspectRating';
import { useReviewStore } from '../../store/reviewStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import type { Trip, User } from '../../types';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5, 'Rating cannot exceed 5 stars'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
  is_anonymous: z.boolean(),
  aspects: z.object({
    punctuality: z.number().min(1).max(5).optional(),
    communication: z.number().min(1).max(5).optional(),
    cleanliness: z.number().min(1).max(5).optional(),
    driving: z.number().min(1).max(5).optional(),
    friendliness: z.number().min(1).max(5).optional(),
  }).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  trip: Trip;
  reviewedUser: User;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({ 
  trip, 
  reviewedUser, 
  onSuccess, 
  onCancel, 
  className = '' 
}: ReviewFormProps) {
  const { user } = useAuthStore();
  const { createReview, isSubmitting } = useReviewStore();
  const { showToast } = useToast();
  const [showAspects, setShowAspects] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
      is_anonymous: false,
      aspects: {
        punctuality: 0,
        communication: 0,
        cleanliness: 0,
        driving: 0,
        friendliness: 0,
      },
    },
    mode: 'onChange',
  });

  const watchedRating = watch('rating');
  const watchedComment = watch('comment');
  const watchedAspects = watch('aspects');

  const onSubmit = async (data: ReviewFormData) => {
    if (!user?.id) {
      showToast('Authentication required', 'error');
      return;
    }

    try {
      const review = await createReview({
        trip_id: trip.id,
        reviewer_id: user.id,
        reviewed_user_id: reviewedUser.id,
        rating: data.rating,
        comment: data.comment,
        is_anonymous: data.is_anonymous,
        aspects: showAspects ? data.aspects : undefined,
      });

      if (review) {
        showToast('Review submitted successfully!', 'success');
        reset();
        onSuccess?.();
      }
    } catch (error) {
      showToast('Failed to submit review', 'error');
    }
  };

  const aspectLabels = {
    punctuality: 'Punctuality',
    communication: 'Communication',
    cleanliness: 'Cleanliness',
    driving: 'Driving Skills',
    friendliness: 'Friendliness',
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select rating';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Review {reviewedUser.name}
        </h3>
        <div className="text-sm text-gray-600">
          <p className="mb-1">
            <span className="font-medium">Trip:</span> {trip.origin} → {trip.destination}
          </p>
          <p>
            Share your experience to help other travelers make informed decisions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating *
          </label>
          <div className="flex items-center space-x-4">
            <StarRating
              rating={watchedRating}
              onRate={(rating) => setValue('rating', rating, { shouldValidate: true })}
              size="lg"
              disabled={isSubmitting}
            />
            <div className="text-sm text-gray-600">
              {getRatingText(watchedRating)}
            </div>
          </div>
          {errors.rating && (
            <p className="text-sm text-red-600 mt-1">{errors.rating.message}</p>
          )}
        </div>

        {/* Detailed Aspects (Optional) */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <input
              type="checkbox"
              checked={showAspects}
              onChange={(e) => setShowAspects(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <span>Rate specific aspects (optional)</span>
          </label>

          {showAspects && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              {Object.entries(aspectLabels).map(([aspect, label]) => (
                <AspectRating
                  key={aspect}
                  label={label}
                  rating={watchedAspects?.[aspect as keyof typeof aspectLabels] || 0}
                  onRate={(rating) => 
                    setValue(`aspects.${aspect as keyof typeof aspectLabels}`, rating, { shouldValidate: true })
                  }
                  disabled={isSubmitting}
                />
              ))}
            </div>
          )}
        </div>

        {/* Written Review */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Written Review (optional)
          </label>
          <TextArea
            {...register('comment')}
            placeholder="Share details about your experience, what went well, or areas for improvement..."
            rows={4}
            error={errors.comment?.message}
            disabled={isSubmitting}
          />
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>Be honest and constructive in your feedback</span>
            <span>{watchedComment?.length || 0}/1000</span>
          </div>
        </div>

        {/* Anonymous Option */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <input
              {...register('is_anonymous')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <span>Submit review anonymously</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Your identity will be hidden from the reviewed user, but the review will still count toward their rating
          </p>
        </div>

        {/* Review Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Review Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be honest and fair in your assessment</li>
            <li>• Focus on the trip experience and user behavior</li>
            <li>• Avoid personal attacks or discriminatory language</li>
            <li>• Your review helps build trust in the community</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Review...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Submit Review</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}