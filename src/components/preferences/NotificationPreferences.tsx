import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Button, Checkbox, LoadingSpinner } from '../ui';
import { useUserPreferencesStore, useNotificationPreferences } from '../../store/userPreferencesStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';

const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  marketing_emails: z.boolean(),
  notify_new_matches: z.boolean(),
  notify_trip_requests: z.boolean(),
  notify_messages: z.boolean(),
  notify_trip_updates: z.boolean(),
});

type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;

interface NotificationPreferencesProps {
  onSave?: () => void;
  className?: string;
}

export function NotificationPreferences({ onSave, className = '' }: NotificationPreferencesProps) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const {
    preferences,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    getUserPreferences,
    updateNotificationPreferences,
    setHasUnsavedChanges,
  } = useUserPreferencesStore();

  const notificationPrefs = useNotificationPreferences();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<NotificationPreferencesFormData>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      notify_new_matches: true,
      notify_trip_requests: true,
      notify_messages: true,
      notify_trip_updates: true,
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
        email_notifications: preferences.email_notifications ?? true,
        push_notifications: preferences.push_notifications ?? true,
        sms_notifications: preferences.sms_notifications ?? false,
        marketing_emails: preferences.marketing_emails ?? false,
        notify_new_matches: preferences.notify_new_matches ?? true,
        notify_trip_requests: preferences.notify_trip_requests ?? true,
        notify_messages: preferences.notify_messages ?? true,
        notify_trip_updates: preferences.notify_trip_updates ?? true,
      });
    }
  }, [preferences, reset]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  const onSubmit = async (data: NotificationPreferencesFormData) => {
    if (!user?.id) return;

    try {
      const result = await updateNotificationPreferences(user.id, data);
      
      if (result.success) {
        showToast('Notification preferences updated successfully', 'success');
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

  const handleMasterToggle = (category: 'email' | 'push' | 'sms', enabled: boolean) => {
    if (category === 'email') {
      setValue('email_notifications', enabled);
      if (!enabled) {
        setValue('marketing_emails', false);
      }
    } else if (category === 'push') {
      setValue('push_notifications', enabled);
    } else if (category === 'sms') {
      setValue('sms_notifications', enabled);
    }
  };

  const handleActivityToggle = (activity: keyof NotificationPreferencesFormData, enabled: boolean) => {
    setValue(activity, enabled);
  };

  const getActiveNotificationCount = () => {
    const activities = [
      'notify_new_matches',
      'notify_trip_requests', 
      'notify_messages',
      'notify_trip_updates'
    ] as const;
    
    return activities.filter(activity => watchedValues[activity]).length;
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
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
            <p className="text-sm text-gray-600 mt-1">
              Choose how you want to receive updates and notifications
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
          {/* Notification Delivery Methods */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Delivery Methods</h4>
            
            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-start space-x-3">
                <div className="pt-1">
                  <Checkbox
                    {...register('email_notifications')}
                    onChange={(e) => handleMasterToggle('email', e.target.checked)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-gray-900">Email Notifications</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive notifications via email to {user?.email}
                  </p>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="flex items-start space-x-3">
                <div className="pt-1">
                  <Checkbox
                    {...register('push_notifications')}
                    onChange={(e) => handleMasterToggle('push', e.target.checked)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v10z" />
                    </svg>
                    <span className="font-medium text-gray-900">Push Notifications</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Get instant notifications on your device
                  </p>
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-start space-x-3">
                <div className="pt-1">
                  <Checkbox
                    {...register('sms_notifications')}
                    onChange={(e) => handleMasterToggle('sms', e.target.checked)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium text-gray-900">SMS Notifications</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive important notifications via text message
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">What to Notify About</h4>
              <div className="text-sm text-gray-600">
                {getActiveNotificationCount()} of 4 active
              </div>
            </div>
            
            <div className="space-y-4">
              {/* New Matches */}
              <div className="flex items-start space-x-3">
                <div className="pt-1">
                  <Checkbox
                    {...register('notify_new_matches')}
                    onChange={(e) => handleActivityToggle('notify_new_matches', e.target.checked)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium text-gray-900">New Matches</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    When we find compatible trips for you
                  </p>
                </div>
              </div>

              {/* Trip Requests */}
              <div className="flex items-start space-x-3">
                <div className="pt-1">
                  <Checkbox
                    {...register('notify_trip_requests')}
                    onChange={(e) => handleActivityToggle('notify_trip_requests', e.target.checked)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="font-medium text-gray-900">Trip Requests</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    When someone requests to join your trip
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex items-start space-x-3">
                <div className="pt-1">
                  <Checkbox
                    {...register('notify_messages')}
                    onChange={(e) => handleActivityToggle('notify_messages', e.target.checked)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium text-gray-900">Messages</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    When you receive new chat messages
                  </p>
                </div>
              </div>

              {/* Trip Updates */}
              <div className="flex items-start space-x-3">
                <div className="pt-1">
                  <Checkbox
                    {...register('notify_trip_updates')}
                    onChange={(e) => handleActivityToggle('notify_trip_updates', e.target.checked)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-gray-900">Trip Updates</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    When trip details change or are cancelled
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Marketing & Promotions</h4>
            
            <div className="flex items-start space-x-3">
              <div className="pt-1">
                <Checkbox
                  {...register('marketing_emails')}
                  disabled={!watchedValues.email_notifications}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-.5 14a2 2 0 002 2h7a2 2 0 002-2L17 4M9 8v4m6-4v4" />
                  </svg>
                  <span className="font-medium text-gray-900">Marketing Emails</span>
                  {!watchedValues.email_notifications && (
                    <span className="text-xs text-gray-500">(requires email notifications)</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Receive updates about new features, tips, and special offers
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Notification Summary</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Delivery methods:</strong> {' '}
                {[
                  watchedValues.email_notifications && 'Email',
                  watchedValues.push_notifications && 'Push',
                  watchedValues.sms_notifications && 'SMS'
                ].filter(Boolean).join(', ') || 'None'}
              </p>
              <p>
                <strong>Active notifications:</strong> {getActiveNotificationCount()} of 4
              </p>
            </div>
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