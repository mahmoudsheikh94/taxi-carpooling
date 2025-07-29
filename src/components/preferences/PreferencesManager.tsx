import { useState } from 'react';
import { Card, Button, Badge } from '../ui';
import { MatchingPreferences } from './MatchingPreferences';
import { NotificationPreferences } from './NotificationPreferences';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import { useToast } from '../ui/Toast';

interface PreferencesManagerProps {
  defaultTab?: 'matching' | 'notifications';
  onClose?: () => void;
  className?: string;
}

export function PreferencesManager({
  defaultTab = 'matching',
  onClose,
  className = '',
}: PreferencesManagerProps) {
  const [activeTab, setActiveTab] = useState<'matching' | 'notifications'>(defaultTab);
  const { hasUnsavedChanges, reset } = useUserPreferencesStore();
  const { showToast } = useToast();

  const handleTabChange = (tab: 'matching' | 'notifications') => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        'You have unsaved changes. Are you sure you want to switch tabs? Your changes will be lost.'
      );
      
      if (!confirmSwitch) {
        return;
      }
      
      reset();
    }
    
    setActiveTab(tab);
  };

  const handleSave = () => {
    showToast('Preferences saved successfully', 'success');
    onClose?.();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close? Your changes will be lost.'
      );
      
      if (!confirmClose) {
        return;
      }
      
      reset();
    }
    
    onClose?.();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
          <p className="text-gray-600 mt-1">
            Customize your trip matching and notification settings
          </p>
        </div>
        
        {onClose && (
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Close</span>
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <Card className="p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => handleTabChange('matching')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'matching'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Matching</span>
            {activeTab === 'matching' && hasUnsavedChanges && (
              <Badge color="amber" size="sm">Unsaved</Badge>
            )}
          </button>
          
          <button
            onClick={() => handleTabChange('notifications')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v10z" />
            </svg>
            <span>Notifications</span>
            {activeTab === 'notifications' && hasUnsavedChanges && (
              <Badge color="amber" size="sm">Unsaved</Badge>
            )}
          </button>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'matching' && (
          <MatchingPreferences onSave={handleSave} />
        )}
        
        {activeTab === 'notifications' && (
          <NotificationPreferences onSave={handleSave} />
        )}
      </div>

      {/* Help Text */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tips for better matches:</p>
            <ul className="space-y-1 text-blue-700">
              {activeTab === 'matching' ? (
                <>
                  <li>• Set realistic detour distances to find more compatible trips</li>
                  <li>• Allow some time flexibility for better matching opportunities</li>
                  <li>• Clear preferences help us find the right travel companions</li>
                </>
              ) : (
                <>
                  <li>• Enable push notifications for instant match alerts</li>
                  <li>• Turn on trip updates to stay informed about changes</li>
                  <li>• Message notifications help you respond quickly to travelers</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </Card>

      {/* Warning for unsaved changes */}
      {hasUnsavedChanges && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-medium">You have unsaved changes</p>
              <p>Don't forget to save your preferences before leaving this page.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}