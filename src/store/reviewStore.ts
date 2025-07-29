import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { reviewService, type UserRatingStats } from '../services/supabase/reviews';
import type { Review } from '../types';
import type { CreateReviewData, UpdateReviewData, ReviewFilters } from '../services/supabase/reviews';

interface ReviewState {
  // Review data
  reviews: Review[];
  givenReviews: Review[];
  receivedReviews: Review[];
  currentReview: Review | null;
  
  // User rating stats
  userRatingStats: Record<string, UserRatingStats>;
  
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    total: number;
    offset: number;
    hasMore: boolean;
  };
  
  // Filters
  filters: ReviewFilters;
}

interface ReviewActions {
  // Review operations
  createReview: (data: CreateReviewData) => Promise<Review | null>;
  updateReview: (reviewId: string, data: UpdateReviewData) => Promise<Review | null>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  
  // Data fetching
  getReview: (reviewId: string) => Promise<void>;
  getReviews: (filters?: ReviewFilters, loadMore?: boolean) => Promise<void>;
  getUserReviews: (userId: string, type?: 'given' | 'received') => Promise<void>;
  getTripReviews: (tripId: string) => Promise<void>;
  refreshReviews: () => Promise<void>;
  
  // Rating stats
  getUserRatingStats: (userId: string) => Promise<UserRatingStats | null>;
  refreshUserStats: (userId: string) => Promise<void>;
  
  // Review eligibility
  canUserReview: (tripId: string, reviewerId: string, reviewedUserId: string) => Promise<{ canReview: boolean; reason?: string }>;
  
  // State management
  setCurrentReview: (review: Review | null) => void;
  setFilters: (filters: Partial<ReviewFilters>) => void;
  clearError: () => void;
  reset: () => void;
}

type ReviewStore = ReviewState & ReviewActions;

const initialState: ReviewState = {
  reviews: [],
  givenReviews: [],
  receivedReviews: [],
  currentReview: null,
  userRatingStats: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
  pagination: {
    total: 0,
    offset: 0,
    hasMore: false,
  },
  filters: {},
};

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      createReview: async (data: CreateReviewData) => {
        set({ isSubmitting: true, error: null });
        
        try {
          const { review, error } = await reviewService.createReview(data);
          
          if (error) {
            set({ error, isSubmitting: false });
            return null;
          }
          
          if (review) {
            set(state => ({
              reviews: [review, ...state.reviews],
              givenReviews: [review, ...state.givenReviews],
              isSubmitting: false,
              error: null,
            }));

            // Refresh user stats for the reviewed user
            get().refreshUserStats(data.reviewed_user_id);
          }
          
          return review;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to create review';
          set({ error, isSubmitting: false });
          return null;
        }
      },

      updateReview: async (reviewId: string, data: UpdateReviewData) => {
        set({ isSubmitting: true, error: null });
        
        try {
          const { review, error } = await reviewService.updateReview(reviewId, data);
          
          if (error) {
            set({ error, isSubmitting: false });
            return null;
          }
          
          if (review) {
            set(state => ({
              reviews: state.reviews.map(r => r.id === reviewId ? review : r),
              givenReviews: state.givenReviews.map(r => r.id === reviewId ? review : r),
              receivedReviews: state.receivedReviews.map(r => r.id === reviewId ? review : r),
              currentReview: state.currentReview?.id === reviewId ? review : state.currentReview,
              isSubmitting: false,
              error: null,
            }));

            // Refresh user stats if rating was updated
            if (data.rating !== undefined) {
              get().refreshUserStats(review.reviewed_user_id);
            }
          }
          
          return review;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update review';
          set({ error, isSubmitting: false });
          return null;
        }
      },

      deleteReview: async (reviewId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { success, error } = await reviewService.deleteReview(reviewId);
          
          if (error) {
            set({ error, isLoading: false });
            return false;
          }
          
          if (success) {
            set(state => {
              const deletedReview = state.reviews.find(r => r.id === reviewId);
              return {
                reviews: state.reviews.filter(r => r.id !== reviewId),
                givenReviews: state.givenReviews.filter(r => r.id !== reviewId),
                receivedReviews: state.receivedReviews.filter(r => r.id !== reviewId),
                currentReview: state.currentReview?.id === reviewId ? null : state.currentReview,
                isLoading: false,
                error: null,
              };
            });

            // Refresh user stats for the reviewed user
            const deletedReview = get().reviews.find(r => r.id === reviewId);
            if (deletedReview) {
              get().refreshUserStats(deletedReview.reviewed_user_id);
            }
          }
          
          return success;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to delete review';
          set({ error, isLoading: false });
          return false;
        }
      },

      getReview: async (reviewId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { review, error } = await reviewService.getReview(reviewId);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          if (review) {
            set({ currentReview: review, isLoading: false, error: null });
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to fetch review';
          set({ error, isLoading: false });
        }
      },

      getReviews: async (filters?: ReviewFilters, loadMore = false) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentState = get();
          const effectiveFilters = { ...currentState.filters, ...filters };
          
          if (loadMore) {
            effectiveFilters.offset = currentState.pagination.offset;
          } else {
            effectiveFilters.offset = 0;
          }
          
          const { reviews, total, error } = await reviewService.getReviews(effectiveFilters);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set(state => ({
            reviews: loadMore ? [...state.reviews, ...reviews] : reviews,
            pagination: {
              total,
              offset: (effectiveFilters.offset || 0) + reviews.length,
              hasMore: ((effectiveFilters.offset || 0) + reviews.length) < total,
            },
            filters: effectiveFilters,
            isLoading: false,
            error: null,
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to fetch reviews';
          set({ error, isLoading: false });
        }
      },

      getUserReviews: async (userId: string, type = 'received') => {
        set({ isLoading: true, error: null });
        
        try {
          const { reviews, total, error } = await reviewService.getUserReviews(userId, type);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          if (type === 'given') {
            set({
              givenReviews: reviews,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              receivedReviews: reviews,
              isLoading: false,
              error: null,
            });
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to fetch user reviews';
          set({ error, isLoading: false });
        }
      },

      getTripReviews: async (tripId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { reviews, total, error } = await reviewService.getTripReviews(tripId);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({
            reviews,
            pagination: {
              total,
              offset: reviews.length,
              hasMore: false,
            },
            isLoading: false,
            error: null,
          });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to fetch trip reviews';
          set({ error, isLoading: false });
        }
      },

      refreshReviews: async () => {
        const { filters } = get();
        await get().getReviews(filters, false);
      },

      getUserRatingStats: async (userId: string) => {
        try {
          const { stats, error } = await reviewService.getUserRatingStats(userId);
          
          if (error) {
            console.error('Failed to fetch user rating stats:', error);
            return null;
          }
          
          if (stats) {
            set(state => ({
              userRatingStats: {
                ...state.userRatingStats,
                [userId]: stats,
              },
            }));
          }
          
          return stats;
        } catch (err) {
          console.error('Failed to fetch user rating stats:', err);
          return null;
        }
      },

      refreshUserStats: async (userId: string) => {
        await get().getUserRatingStats(userId);
      },

      canUserReview: async (tripId: string, reviewerId: string, reviewedUserId: string) => {
        try {
          return await reviewService.canUserReview(tripId, reviewerId, reviewedUserId);
        } catch (err) {
          console.error('Failed to check review eligibility:', err);
          return { canReview: false, reason: 'Failed to check eligibility' };
        }
      },

      setCurrentReview: (review: Review | null) => {
        set({ currentReview: review });
      },

      setFilters: (newFilters: Partial<ReviewFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'review-store',
      partialize: (state) => ({
        // Only persist essential data, not loading states
        reviews: state.reviews,
        givenReviews: state.givenReviews,
        receivedReviews: state.receivedReviews,
        userRatingStats: state.userRatingStats,
        filters: state.filters,
      }),
    }
  )
);