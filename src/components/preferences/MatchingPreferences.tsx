import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Button, Input, Select, Checkbox, LoadingSpinner } from '../ui';
import { useUserPreferencesStore, useMatchingPreferences } from '../../store/userPreferencesStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';

const matchingPreferencesSchema = z.object({
  max_detour_distance: z.number().min(0).max(50),
  max_detour_time: z.number().min(0).max(120),
  max_walking_distance: z.number().min(50).max(2000),
  time_flexibility: z.number().min(0).max(180),
  price_range_min: z.number().min(0),
  price_range_max: z.number().min(0),
  smoking_preference: z.enum(['no_preference', 'smoking_ok', 'no_smoking']),
  pets_preference: z.enum(['no_preference', 'pets_ok', 'no_pets']),
  music_preference: z.enum(['no_preference', 'music_ok', 'quiet_preferred']),
  conversation_level: z.enum(['no_preference', 'chatty', 'quiet']),
  gender_preference: z.enum(['no_preference', 'same_gender', 'any_gender']).optional(),
  min_age: z.number().min(18).max(100).optional(),
  max_age: z.number().min(18).max(100).optional(),
});

type MatchingPreferencesFormData = z.infer<typeof matchingPreferencesSchema>;

interface MatchingPreferencesProps {
  onSave?: () => void;
  className?: string;
}

export function MatchingPreferences({ onSave, className = '' }: MatchingPreferencesProps) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const {
    preferences,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    getUserPreferences,
    updateMatchingPreferences,
    validatePreferences,
    setHasUnsavedChanges,
  } = useUserPreferencesStore();

  const matchingPrefs = useMatchingPreferences();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<MatchingPreferencesFormData>({
    resolver: zodResolver(matchingPreferencesSchema),
    defaultValues: {
      max_detour_distance: 10,
      max_detour_time: 30,
      max_walking_distance: 500,
      time_flexibility: 15,
      price_range_min: 0,
      price_range_max: 100,
      smoking_preference: 'no_preference',
      pets_preference: 'no_preference',
      music_preference: 'no_preference',
      conversation_level: 'no_preference',
      gender_preference: 'no_preference',
      min_age: 18,
      max_age: 65,
    },
  });

  const watchedValues = watch();

  // Load user preferences on mount
  useEffect(() => {
    if (user?.id) {
      getUserPreferences(user.id);
    }
  }, [user?.id, getUserPreferences]);

  // Update form when preferences are loaded
  useEffect(() => {
    if (preferences) {
      reset({
        max_detour_distance: preferences.max_detour_distance || 10,
        max_detour_time: preferences.max_detour_time || 30,
        max_walking_distance: preferences.max_walking_distance || 500,
        time_flexibility: preferences.time_flexibility || 15,
        price_range_min: preferences.price_range_min || 0,
        price_range_max: preferences.price_range_max || 100,
        smoking_preference: preferences.smoking_preference || 'no_preference',
        pets_preference: preferences.pets_preference || 'no_preference',
        music_preference: preferences.music_preference || 'no_preference',
        conversation_level: preferences.conversation_level || 'no_preference',
        gender_preference: preferences.gender_preference || 'no_preference',
        min_age: preferences.min_age || 18,
        max_age: preferences.max_age || 65,
      });
    }
  }, [preferences, reset]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  const onSubmit = async (data: MatchingPreferencesFormData) => {
    if (!user?.id) return;

    // Validate age range
    if (data.min_age && data.max_age && data.min_age > data.max_age) {
      showToast('Minimum age cannot be greater than maximum age', 'error');
      return;
    }

    // Validate price range
    if (data.price_range_min > data.price_range_max) {
      showToast('Minimum price cannot be greater than maximum price', 'error');
      return;
    }

    try {
      const result = await updateMatchingPreferences(user.id, data);
      
      if (result.success) {
        showToast('Matching preferences updated successfully', 'success');
        onSave?.();
      } else {
        showToast(result.error || 'Failed to update preferences', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred', 'error');
    }
  };

  const handleReset = () => {
    reset();
    setHasUnsavedChanges(false);
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading your preferences...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Matching Preferences</h3>
            <p className="text-sm text-gray-600 mt-1">
              Customize how we find compatible trips for you
            </p>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-1 text-sm text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Unsaved changes</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Distance and Time Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Distance & Time</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Detour Distance (km)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  {...register('max_detour_distance', { valueAsNumber: true })}
                  error={errors.max_detour_distance?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  How far out of the way you're willing to go
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Detour Time (minutes)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  step="5"
                  {...register('max_detour_time', { valueAsNumber: true })}
                  error={errors.max_detour_time?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Additional travel time you'll accept
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Walking Distance (meters)
                </label>
                <Input
                  type="number"
                  min="50"
                  max="2000"
                  step="50"
                  {...register('max_walking_distance', { valueAsNumber: true })}
                  error={errors.max_walking_distance?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  How far you'll walk to meeting points
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Flexibility (minutes)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="180"
                  step="5"
                  {...register('time_flexibility', { valueAsNumber: true })}
                  error={errors.time_flexibility?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  How flexible you are with departure times
                </p>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Price Range</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Price per Seat ($)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  {...register('price_range_min', { valueAsNumber: true })}
                  error={errors.price_range_min?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Price per Seat ($)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  {...register('price_range_max', { valueAsNumber: true })}
                  error={errors.price_range_max?.message}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Current range: ${watchedValues.price_range_min} - ${watchedValues.price_range_max} per seat
              </p>
            </div>
          </div>

          {/* Trip Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Trip Preferences</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Smoking Preference
                </label>
                <Select
                  {...register('smoking_preference')}
                  error={errors.smoking_preference?.message}
                >
                  <option value="no_preference">No Preference</option>
                  <option value="smoking_ok">Smoking OK</option>
                  <option value="no_smoking">No Smoking</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pets Preference
                </label>
                <Select
                  {...register('pets_preference')}
                  error={errors.pets_preference?.message}
                >
                  <option value="no_preference">No Preference</option>
                  <option value="pets_ok">Pets OK</option>
                  <option value="no_pets">No Pets</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Music Preference
                </label>
                <Select
                  {...register('music_preference')}
                  error={errors.music_preference?.message}
                >
                  <option value="no_preference">No Preference</option>
                  <option value="music_ok">Music OK</option>
                  <option value="quiet_preferred">Quiet Preferred</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conversation Level
                </label>
                <Select
                  {...register('conversation_level')}
                  error={errors.conversation_level?.message}
                >
                  <option value="no_preference">No Preference</option>
                  <option value="chatty">Chatty</option>
                  <option value="quiet">Quiet Trip</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Advanced Preferences */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Advanced Preferences</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender Preference
                  </label>
                  <Select
                    {...register('gender_preference')}
                    error={errors.gender_preference?.message}
                  >
                    <option value="no_preference">No Preference</option>
                    <option value="same_gender">Same Gender</option>
                    <option value="any_gender">Any Gender</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Age
                  </label>
                  <Input
                    type="number"
                    min="18"
                    max="100"
                    {...register('min_age', { valueAsNumber: true })}
                    error={errors.min_age?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Age
                  </label>
                  <Input
                    type="number"
                    min="18"
                    max="100"
                    {...register('max_age', { valueAsNumber: true })}
                    error={errors.max_age?.message}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSaving || !isDirty}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!isDirty}
              className="flex-1 sm:flex-none"
            >
              Reset Changes
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}