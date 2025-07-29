import { supabase } from './client';
import type { Review, User } from '../../types';

export interface CreateReviewData {
  trip_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
  aspects?: {
    punctuality?: number;
    communication?: number;
    cleanliness?: number;
    driving?: number;
    friendliness?: number;
  };
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  is_anonymous?: boolean;
  aspects?: {
    punctuality?: number;
    communication?: number;
    cleanliness?: number;
    driving?: number;
    friendliness?: number;
  };
}

export interface ReviewFilters {
  trip_id?: string;
  reviewer_id?: string;
  reviewed_user_id?: string;
  rating_min?: number;
  rating_max?: number;
  is_anonymous?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface ReviewResponse {
  review: Review | null;
  error: string | null;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  error: string | null;
}

export interface UserRatingStats {
  user_id: string;
  rating_average: number;
  rating_count: number;
  aspect_averages: {
    punctuality?: number;
    communication?: number;
    cleanliness?: number;
    driving?: number;
    friendliness?: number;
  };
  rating_distribution: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
}

class ReviewService {
  async createReview(data: CreateReviewData): Promise<ReviewResponse> {
    try {
      // Check if user has already reviewed this user for this trip
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('trip_id', data.trip_id)
        .eq('reviewer_id', data.reviewer_id)
        .eq('reviewed_user_id', data.reviewed_user_id)
        .single();

      if (existingReview) {
        return { 
          review: null, 
          error: 'You have already reviewed this user for this trip' 
        };
      }

      // Create the review
      const { data: review, error } = await supabase
        .from('reviews')
        .insert([data])
        .select(`
          *,
          reviewer:reviewer_id(id, name, avatar),
          reviewed_user:reviewed_user_id(id, name, avatar),
          trip:trips(id, origin, destination, departure_time)
        `)
        .single();

      if (error) {
        console.error('Error creating review:', error);
        return { review: null, error: error.message };
      }

      // Update user's rating statistics
      await this.updateUserRatingStats(data.reviewed_user_id);

      return { review, error: null };
    } catch (err) {
      console.error('Unexpected error creating review:', err);
      return { 
        review: null, 
        error: err instanceof Error ? err.message : 'Failed to create review' 
      };
    }
  }

  async updateReview(reviewId: string, data: UpdateReviewData): Promise<ReviewResponse> {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .update(data)
        .eq('id', reviewId)
        .select(`
          *,
          reviewer:reviewer_id(id, name, avatar),
          reviewed_user:reviewed_user_id(id, name, avatar),
          trip:trips(id, origin, destination, departure_time)
        `)
        .single();

      if (error) {
        console.error('Error updating review:', error);
        return { review: null, error: error.message };
      }

      // Update user's rating statistics if rating changed
      if (data.rating !== undefined) {
        await this.updateUserRatingStats(review.reviewed_user_id);
      }

      return { review, error: null };
    } catch (err) {
      console.error('Unexpected error updating review:', err);
      return { 
        review: null, 
        error: err instanceof Error ? err.message : 'Failed to update review' 
      };
    }
  }

  async getReview(reviewId: string): Promise<ReviewResponse> {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id(id, name, avatar),
          reviewed_user:reviewed_user_id(id, name, avatar),
          trip:trips(id, origin, destination, departure_time)
        `)
        .eq('id', reviewId)
        .single();

      if (error) {
        console.error('Error fetching review:', error);
        return { review: null, error: error.message };
      }

      return { review, error: null };
    } catch (err) {
      console.error('Unexpected error fetching review:', err);
      return { 
        review: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch review' 
      };
    }
  }

  async getReviews(filters: ReviewFilters = {}): Promise<ReviewsResponse> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id(id, name, avatar),
          reviewed_user:reviewed_user_id(id, name, avatar),
          trip:trips(id, origin, destination, departure_time)
        `, { count: 'exact' });

      // Apply filters
      if (filters.trip_id) {
        query = query.eq('trip_id', filters.trip_id);
      }

      if (filters.reviewer_id) {
        query = query.eq('reviewer_id', filters.reviewer_id);
      }

      if (filters.reviewed_user_id) {
        query = query.eq('reviewed_user_id', filters.reviewed_user_id);
      }

      if (filters.rating_min !== undefined) {
        query = query.gte('rating', filters.rating_min);
      }

      if (filters.rating_max !== undefined) {
        query = query.lte('rating', filters.rating_max);
      }

      if (filters.is_anonymous !== undefined) {
        query = query.eq('is_anonymous', filters.is_anonymous);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Pagination
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data: reviews, error, count } = await query;

      if (error) {
        console.error('Error fetching reviews:', error);
        return { reviews: [], total: 0, error: error.message };
      }

      return { 
        reviews: reviews || [], 
        total: count || 0, 
        error: null 
      };
    } catch (err) {
      console.error('Unexpected error fetching reviews:', err);
      return { 
        reviews: [], 
        total: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch reviews' 
      };
    }
  }

  async getUserReviews(userId: string, type: 'given' | 'received' = 'received'): Promise<ReviewsResponse> {
    const filters: ReviewFilters = {};
    
    if (type === 'given') {
      filters.reviewer_id = userId;
    } else {
      filters.reviewed_user_id = userId;
    }

    return this.getReviews(filters);
  }

  async deleteReview(reviewId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get the review first to update stats after deletion
      const { data: review } = await supabase
        .from('reviews')
        .select('reviewed_user_id')
        .eq('id', reviewId)
        .single();

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Error deleting review:', error);
        return { success: false, error: error.message };
      }

      // Update user's rating statistics
      if (review?.reviewed_user_id) {
        await this.updateUserRatingStats(review.reviewed_user_id);
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Unexpected error deleting review:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete review' 
      };
    }
  }

  async getUserRatingStats(userId: string): Promise<{ stats: UserRatingStats | null; error: string | null }> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating, aspects')
        .eq('reviewed_user_id', userId);

      if (error) {
        console.error('Error fetching user rating stats:', error);
        return { stats: null, error: error.message };
      }

      if (!reviews || reviews.length === 0) {
        return {
          stats: {
            user_id: userId,
            rating_average: 0,
            rating_count: 0,
            aspect_averages: {},
            rating_distribution: {
              five_star: 0,
              four_star: 0,
              three_star: 0,
              two_star: 0,
              one_star: 0,
            },
          },
          error: null,
        };
      }

      // Calculate rating average
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const rating_average = totalRating / reviews.length;

      // Calculate rating distribution
      const rating_distribution = {
        five_star: reviews.filter(r => r.rating === 5).length,
        four_star: reviews.filter(r => r.rating === 4).length,
        three_star: reviews.filter(r => r.rating === 3).length,
        two_star: reviews.filter(r => r.rating === 2).length,
        one_star: reviews.filter(r => r.rating === 1).length,
      };

      // Calculate aspect averages
      const aspectTotals: Record<string, { sum: number; count: number }> = {};
      
      reviews.forEach(review => {
        if (review.aspects) {
          Object.entries(review.aspects).forEach(([aspect, rating]) => {
            if (rating !== undefined && rating !== null) {
              if (!aspectTotals[aspect]) {
                aspectTotals[aspect] = { sum: 0, count: 0 };
              }
              aspectTotals[aspect].sum += rating;
              aspectTotals[aspect].count += 1;
            }
          });
        }
      });

      const aspect_averages: Record<string, number> = {};
      Object.entries(aspectTotals).forEach(([aspect, { sum, count }]) => {
        aspect_averages[aspect] = sum / count;
      });

      const stats: UserRatingStats = {
        user_id: userId,
        rating_average: Math.round(rating_average * 10) / 10, // Round to 1 decimal
        rating_count: reviews.length,
        aspect_averages,
        rating_distribution,
      };

      return { stats, error: null };
    } catch (err) {
      console.error('Unexpected error calculating rating stats:', err);
      return { 
        stats: null, 
        error: err instanceof Error ? err.message : 'Failed to calculate rating stats' 
      };
    }
  }

  async canUserReview(tripId: string, reviewerId: string, reviewedUserId: string): Promise<{ canReview: boolean; reason?: string }> {
    try {
      // Check if the trip is completed
      const { data: trip } = await supabase
        .from('trips')
        .select('status, departure_time')
        .eq('id', tripId)
        .single();

      if (!trip) {
        return { canReview: false, reason: 'Trip not found' };
      }

      if (trip.status !== 'COMPLETED') {
        return { canReview: false, reason: 'Trip must be completed to leave a review' };
      }

      // Check if user has already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('trip_id', tripId)
        .eq('reviewer_id', reviewerId)
        .eq('reviewed_user_id', reviewedUserId)
        .single();

      if (existingReview) {
        return { canReview: false, reason: 'You have already reviewed this user for this trip' };
      }

      // Check if enough time has passed (optional - e.g., at least 1 hour after trip departure)
      const departureTime = new Date(trip.departure_time);
      const oneHourAfterDeparture = new Date(departureTime.getTime() + 60 * 60 * 1000);
      
      if (new Date() < oneHourAfterDeparture) {
        return { canReview: false, reason: 'Please wait until after the trip to leave a review' };
      }

      return { canReview: true };
    } catch (err) {
      console.error('Error checking review eligibility:', err);
      return { canReview: false, reason: 'Failed to check review eligibility' };
    }
  }

  private async updateUserRatingStats(userId: string): Promise<void> {
    try {
      const { stats } = await this.getUserRatingStats(userId);
      
      if (stats) {
        // Update the users table with the new rating information
        await supabase
          .from('users')
          .update({
            rating_average: stats.rating_average,
            rating_count: stats.rating_count,
          })
          .eq('id', userId);
      }
    } catch (err) {
      console.error('Error updating user rating stats:', err);
    }
  }

  // Get reviews for a specific trip
  async getTripReviews(tripId: string): Promise<ReviewsResponse> {
    return this.getReviews({ trip_id: tripId });
  }

  // Get average rating for a user
  async getUserAverageRating(userId: string): Promise<{ average: number; count: number }> {
    const { stats } = await this.getUserRatingStats(userId);
    return {
      average: stats?.rating_average || 0,
      count: stats?.rating_count || 0,
    };
  }
}

export const reviewService = new ReviewService();