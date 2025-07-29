import { Badge } from '../ui';

interface CompatibilityScoreProps {
  score: number; // 0-1
  matchType: 'exact_route' | 'partial_overlap' | 'detour_pickup' | 'detour_dropoff';
  showBreakdown?: boolean;
  routeScore?: number;
  timeScore?: number;
  preferencesScore?: number;
  priceScore?: number;
  className?: string;
}

export function CompatibilityScore({
  score,
  matchType,
  showBreakdown = false,
  routeScore,
  timeScore,
  preferencesScore,
  priceScore,
  className = '',
}: CompatibilityScoreProps) {
  // Convert 0-1 score to percentage
  const percentage = Math.round(score * 100);
  
  // Determine color and text based on score
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'blue';
    if (score >= 0.4) return 'yellow';
    return 'red';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Fair Match';
    return 'Poor Match';
  };

  const getMatchTypeText = (type: string) => {
    switch (type) {
      case 'exact_route':
        return 'Same Route';
      case 'partial_overlap':
        return 'Shared Path';
      case 'detour_pickup':
        return 'Pickup Detour';
      case 'detour_dropoff':
        return 'Dropoff Detour';
      default:
        return type;
    }
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'exact_route':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'partial_overlap':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'detour_pickup':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'detour_dropoff':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Score Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Circular Progress */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 42 42">
              {/* Background circle */}
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeLinecap="round"
                className={`text-${getScoreColor(score)}-500 transition-all duration-300`}
              />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-900">
                {percentage}%
              </span>
            </div>
          </div>

          {/* Score details */}
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium text-${getScoreColor(score)}-600`}>
                {getScoreText(score)}
              </span>
              <Badge color={getScoreColor(score)} size="sm">
                {percentage}%
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1 mt-1">
              {getMatchTypeIcon(matchType)}
              <span className="text-xs text-gray-500">
                {getMatchTypeText(matchType)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {showBreakdown && (routeScore !== undefined || timeScore !== undefined || preferencesScore !== undefined || priceScore !== undefined) && (
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Compatibility Breakdown
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {routeScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Route</span>
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${routeScore * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-900 font-medium">
                    {Math.round(routeScore * 100)}%
                  </span>
                </div>
              </div>
            )}

            {timeScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time</span>
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${timeScore * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-900 font-medium">
                    {Math.round(timeScore * 100)}%
                  </span>
                </div>
              </div>
            )}

            {preferencesScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Preferences</span>
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${preferencesScore * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-900 font-medium">
                    {Math.round(preferencesScore * 100)}%
                  </span>
                </div>
              </div>
            )}

            {priceScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price</span>
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all duration-300"
                      style={{ width: `${priceScore * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-900 font-medium">
                    {Math.round(priceScore * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}