export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          avatar: string | null
          bio: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          is_verified: boolean
          verification_level: 'basic' | 'phone' | 'identity' | 'premium'
          language: string
          timezone: string
          trips_completed: number
          rating_average: number
          rating_count: number
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          avatar?: string | null
          bio?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          is_verified?: boolean
          verification_level?: 'basic' | 'phone' | 'identity' | 'premium'
          language?: string
          timezone?: string
          trips_completed?: number
          rating_average?: number
          rating_count?: number
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          avatar?: string | null
          bio?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          is_verified?: boolean
          verification_level?: 'basic' | 'phone' | 'identity' | 'premium'
          language?: string
          timezone?: string
          trips_completed?: number
          rating_average?: number
          rating_count?: number
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          max_detour_distance: number
          max_detour_time: number
          max_walking_distance: number
          time_flexibility: number
          price_range_min: number
          price_range_max: number
          currency: string
          smoking_preference: 'yes' | 'no' | 'indifferent'
          pets_preference: boolean
          music_preference: 'yes' | 'no' | 'indifferent'
          conversation_level: 'chatty' | 'quiet' | 'indifferent'
          gender_preference: 'same' | 'any'
          min_age: number | null
          max_age: number | null
          email_notifications: boolean
          push_notifications: boolean
          sms_notifications: boolean
          marketing_emails: boolean
          notify_new_matches: boolean
          notify_trip_requests: boolean
          notify_messages: boolean
          notify_trip_updates: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          max_detour_distance?: number
          max_detour_time?: number
          max_walking_distance?: number
          time_flexibility?: number
          price_range_min?: number
          price_range_max?: number
          currency?: string
          smoking_preference?: 'yes' | 'no' | 'indifferent'
          pets_preference?: boolean
          music_preference?: 'yes' | 'no' | 'indifferent'
          conversation_level?: 'chatty' | 'quiet' | 'indifferent'
          gender_preference?: 'same' | 'any'
          min_age?: number | null
          max_age?: number | null
          email_notifications?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          marketing_emails?: boolean
          notify_new_matches?: boolean
          notify_trip_requests?: boolean
          notify_messages?: boolean
          notify_trip_updates?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          max_detour_distance?: number
          max_detour_time?: number
          max_walking_distance?: number
          time_flexibility?: number
          price_range_min?: number
          price_range_max?: number
          currency?: string
          smoking_preference?: 'yes' | 'no' | 'indifferent'
          pets_preference?: boolean
          music_preference?: 'yes' | 'no' | 'indifferent'
          conversation_level?: 'chatty' | 'quiet' | 'indifferent'
          gender_preference?: 'same' | 'any'
          min_age?: number | null
          max_age?: number | null
          email_notifications?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          marketing_emails?: boolean
          notify_new_matches?: boolean
          notify_trip_requests?: boolean
          notify_messages?: boolean
          notify_trip_updates?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}