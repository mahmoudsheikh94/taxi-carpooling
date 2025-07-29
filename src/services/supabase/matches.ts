import { supabase, handleSupabaseError } from './client';
import type { TripMatch, RouteAnalysis, MeetingPoint } from '../../types';
import type { CompatibilityAnalysis } from '../matching/matchingAlgorithm';

export interface CreateMatchData {
  trip_id: string;
  matched_trip_id: string;
  compatibility_score: number;
  match_type: 'exact_route' | 'partial_overlap' | 'detour_pickup' | 'detour_dropoff';
  route_analysis: RouteAnalysis;
  estimated_savings?: number;
  shared_distance?: number;
  detour_distance?: number;
  detour_time?: number;
  suggested_pickup_point?: MeetingPoint;
  suggested_dropoff_point?: MeetingPoint;
  alternative_meeting_points?: MeetingPoint[];
  time_difference: number;
  time_compatibility_score: number;
}

export interface MatchResponse {
  match: TripMatch | null;
  error: string | null;
}

export interface MatchesResponse {
  matches: TripMatch[];
  error: string | null;
  count?: number;
}

export interface MatchFilters {
  trip_id?: string;
  user_id?: string;
  min_compatibility_score?: number;
  match_type?: string;
  status?: string;
}

export const matchService = {
  /**
   * Create a new trip match
   */
  async createMatch(data: CreateMatchData): Promise<MatchResponse> {
    try {
      // Check if match already exists (prevent duplicates)
      const { data: existingMatch } = await supabase
        .from('trip_matches')
        .select('id')
        .eq('trip_id', data.trip_id)
        .eq('matched_trip_id', data.matched_trip_id)
        .single();

      if (existingMatch) {
        return { match: null, error: 'Match already exists' };
      }

      // Create the match record
      const { data: match, error } = await supabase
        .from('trip_matches')
        .insert({
          ...data,
          status: 'SUGGESTED',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select(`
          *,
          trip:trips!trip_matches_trip_id_fkey(
            *,
            user:users(id, name, email, rating_average, trips_completed)
          ),
          matched_trip:trips!trip_matches_matched_trip_id_fkey(
            *,
            user:users(id, name, email, rating_average, trips_completed)
          )
        `)
        .single();

      if (error) {
        return { match: null, error: handleSupabaseError(error) };
      }

      // Create reciprocal match for bidirectional discovery
      await this.createReciprocalMatch(data);

      return { match: match as TripMatch, error: null };
    } catch (error) {
      return { match: null, error: handleSupabaseError(error) };
    }
  },

  /**
   * Create reciprocal match for bidirectional discovery
   */
  async createReciprocalMatch(originalMatch: CreateMatchData): Promise<void> {
    try {
      const reciprocalData: CreateMatchData = {
        ...originalMatch,
        trip_id: originalMatch.matched_trip_id,
        matched_trip_id: originalMatch.trip_id,
      };

      await supabase
        .from('trip_matches')
        .insert({
          ...reciprocalData,
          status: 'SUGGESTED',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
    } catch (error) {
      console.error('Failed to create reciprocal match:', error);
      // Don't throw error - reciprocal match is nice-to-have
    }
  },

  /**
   * Get matches for a specific trip
   */
  async getTripMatches(
    tripId: string,
    limit = 20,
    offset = 0
  ): Promise<MatchesResponse> {
    try {
      const { data: matches, error, count } = await supabase
        .from('trip_matches')
        .select(`
          *,
          trip:trips!trip_matches_trip_id_fkey(
            *,
            user:users(id, name, email, rating_average, trips_completed)
          ),
          matched_trip:trips!trip_matches_matched_trip_id_fkey(
            *,
            user:users(id, name, email, rating_average, trips_completed)
          )
        `, { count: 'exact' })
        .eq('trip_id', tripId)
        .eq('status', 'SUGGESTED')
        .gte('expires_at', new Date().toISOString())
        .order('compatibility_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { matches: [], error: handleSupabaseError(error) };
      }

      return {
        matches: matches as TripMatch[],
        error: null,
        count: count || 0,
      };
    } catch (error) {
      return { matches: [], error: handleSupabaseError(error) };
    }
  },

  /**
   * Get matches for a user across all their active trips
   */
  async getUserMatches(
    userId: string,
    limit = 50,
    offset = 0,
    filters: MatchFilters = {}
  ): Promise<MatchesResponse> {
    try {
      let query = supabase
        .from('trip_matches')
        .select(`
          *,
          trip:trips!trip_matches_trip_id_fkey(
            *,
            user:users(id, name, email, rating_average, trips_completed)
          ),
          matched_trip:trips!trip_matches_matched_trip_id_fkey(
            *,
            user:users(id, name, email, rating_average, trips_completed)
          )
        `, { count: 'exact' })
        .or(`trip.user_id.eq.${userId},matched_trip.user_id.eq.${userId}`)
        .gte('expires_at', new Date().toISOString());

      // Apply filters
      if (filters.min_compatibility_score) {
        query = query.gte('compatibility_score', filters.min_compatibility_score);
      }

      if (filters.match_type) {
        query = query.eq('match_type', filters.match_type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.in('status', ['SUGGESTED', 'VIEWED']);
      }

      const { data: matches, error, count } = await query
        .order('compatibility_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { matches: [], error: handleSupabaseError(error) };
      }

      return {
        matches: matches as TripMatch[],
        error: null,
        count: count || 0,
      };
    } catch (error) {
      return { matches: [], error: handleSupabaseError(error) };
    }
  },

  /**
   * Get a specific match by ID
   */
  async getMatchById(matchId: string): Promise<MatchResponse> {
    try {
      const { data: match, error } = await supabase
        .from('trip_matches')
        .select(`
          *,
          trip:trips!trip_matches_trip_id_fkey(
            *,
            user:users(id, name, email, rating_average, trips_completed)
          ),
          matched_trip:trips!trip_matches_matched_trip_id_fkey(
            *,
            user:users(id, name, email, rating_average, trips_completed)
          )
        `)
        .eq('id', matchId)
        .single();

      if (error) {
        return { match: null, error: handleSupabaseError(error) };
      }

      return { match: match as TripMatch, error: null };
    } catch (error) {
      return { match: null, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update match status (viewed, contacted, etc.)
   */
  async updateMatchStatus(
    matchId: string,
    status: 'SUGGESTED' | 'VIEWED' | 'CONTACTED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const updateData: any = { status };

      // Set timestamps based on status
      switch (status) {
        case 'VIEWED':
          updateData.viewed_at = new Date().toISOString();
          break;
        case 'CONTACTED':
          updateData.contacted_at = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('trip_matches')
        .update(updateData)
        .eq('id', matchId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Delete a match
   */
  async deleteMatch(matchId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('trip_matches')
        .delete()
        .eq('id', matchId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Bulk create matches from compatibility analysis
   */
  async createMatchesFromAnalysis(
    tripId: string,
    compatibilityResults: CompatibilityAnalysis[],
    candidateTrips: { id: string; [key: string]: any }[]
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < compatibilityResults.length; i++) {
      const analysis = compatibilityResults[i];
      const candidateTrip = candidateTrips[i];

      if (!candidateTrip) continue;

      try {
        const matchData: CreateMatchData = {
          trip_id: tripId,
          matched_trip_id: candidateTrip.id,
          compatibility_score: analysis.overallScore,
          match_type: analysis.matchType,
          route_analysis: {
            commonPath: {},
            deviationFromOriginal: analysis.detourDistance,
            pickupPoints: [],
            dropoffPoints: [],
          },
          estimated_savings: analysis.estimatedSavings,
          shared_distance: 0, // Would need to be calculated from route analysis
          detour_distance: analysis.detourDistance,
          detour_time: analysis.detourTime,
          time_difference: 0, // Would need to be calculated
          time_compatibility_score: analysis.timeCompatibility,
        };

        const result = await this.createMatch(matchData);
        if (result.error) {
          errors.push(`Failed to create match with trip ${candidateTrip.id}: ${result.error}`);
        } else {
          created++;
        }
      } catch (error) {
        errors.push(`Error creating match with trip ${candidateTrip.id}: ${error}`);
      }
    }

    return { created, errors };
  },

  /**
   * Clean up expired matches
   */
  async cleanupExpiredMatches(): Promise<{ deleted: number; error: string | null }> {
    try {
      const { count, error } = await supabase
        .from('trip_matches')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        return { deleted: 0, error: handleSupabaseError(error) };
      }

      return { deleted: count || 0, error: null };
    } catch (error) {
      return { deleted: 0, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get match statistics for a user
   */
  async getMatchStats(userId: string): Promise<{
    total: number;
    viewed: number;
    contacted: number;
    accepted: number;
    avgCompatibilityScore: number;
    error: string | null;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('trip_matches')
        .select('status, compatibility_score')
        .or(`trip.user_id.eq.${userId},matched_trip.user_id.eq.${userId}`);

      if (error) {
        return {
          total: 0,
          viewed: 0,
          contacted: 0,
          accepted: 0,
          avgCompatibilityScore: 0,
          error: handleSupabaseError(error),
        };
      }

      const total = stats.length;
      const viewed = stats.filter(m => ['VIEWED', 'CONTACTED', 'ACCEPTED'].includes(m.status)).length;
      const contacted = stats.filter(m => ['CONTACTED', 'ACCEPTED'].includes(m.status)).length;
      const accepted = stats.filter(m => m.status === 'ACCEPTED').length;
      const avgCompatibilityScore = total > 0 
        ? stats.reduce((sum, m) => sum + m.compatibility_score, 0) / total 
        : 0;

      return {
        total,
        viewed,
        contacted,
        accepted,
        avgCompatibilityScore,
        error: null,
      };
    } catch (error) {
      return {
        total: 0,
        viewed: 0,
        contacted: 0,
        accepted: 0,
        avgCompatibilityScore: 0,
        error: handleSupabaseError(error),
      };
    }
  },

  /**
   * Subscribe to match updates for a user
   */
  subscribeToUserMatches(userId: string, callback: (match: TripMatch) => void) {
    const subscription = supabase
      .channel(`user-matches-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_matches',
          filter: `trip.user_id=eq.${userId},matched_trip.user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as TripMatch);
          }
        }
      )
      .subscribe();

    return subscription;
  },
};