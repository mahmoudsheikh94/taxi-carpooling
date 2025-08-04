import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripFilterSchema } from '../../utils/validations';
import { PlacesAutocomplete } from '../maps';
import { Input, Select, Button, Card, Checkbox, Collapsible } from '../ui';
import { useState } from 'react';
import type { TripFilterFormData } from '../../utils/validations';

interface TripFiltersProps {
  onFiltersChange: (filters: TripFilterFormData) => void;
  onClearFilters?: () => void;
  initialFilters?: TripFilterFormData;
  className?: string;
}

export function TripFilters({ 
  onFiltersChange, 
  onClearFilters,
  initialFilters = {}, 
  className = '' 
}: TripFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(
    Object.keys(initialFilters).length > 0
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<TripFilterFormData>({
    resolver: zodResolver(tripFilterSchema),
    defaultValues: initialFilters,
  });

  const watchedFilters = watch();

  const handleOriginChange = (value: string) => {
    setValue('origin', value);
  };

  const handleDestinationChange = (value: string) => {
    setValue('destination', value);
  };

  const onSubmit = (data: TripFilterFormData) => {
    // Remove empty/undefined values
    const cleanedFilters = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => 
        value !== undefined && value !== '' && value !== null
      )
    );
    
    setHasActiveFilters(Object.keys(cleanedFilters).length > 0);
    onFiltersChange(cleanedFilters);
  };

  const handleClearFilters = () => {
    reset();
    setHasActiveFilters(false);
    onFiltersChange({});
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card className={`p-4 ${className}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Quick Filters - Always Visible */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Find Trips</h3>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <PlacesAutocomplete
              label="From"
              value={watchedFilters.origin || ''}
              onChange={handleOriginChange}
              placeholder="Enter origin city or address"
              error={errors.origin?.message}
              types={['geocode']}
            />
            
            <PlacesAutocomplete
              label="To"
              value={watchedFilters.destination || ''}
              onChange={handleDestinationChange}
              placeholder="Enter destination city or address"
              error={errors.destination?.message}
              types={['geocode']}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Departure Date"
              type="date"
              {...register('departure_date')}
              error={errors.departure_date?.message}
              min={getTodayDate()}
            />
            
            <Input
              label="Passengers Needed"
              type="number"
              {...register('max_passengers', { valueAsNumber: true })}
              error={errors.max_passengers?.message}
              placeholder="Number of seats"
              min={1}
              max={8}
            />
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        <Collapsible
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <span>Advanced Filters</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          }
          isOpen={isExpanded}
        >
          <div className="space-y-4 pt-4 border-t">
            {/* Time Range */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Departure Time Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Earliest Departure"
                  type="datetime-local"
                  {...register('min_departure_time')}
                  error={errors.min_departure_time?.message}
                  min={getMinDateTime()}
                />
                
                <Input
                  label="Latest Departure"
                  type="datetime-local"
                  {...register('max_departure_time')}
                  error={errors.max_departure_time?.message}
                  min={getMinDateTime()}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Price Range (per seat)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Min Price"
                  type="number"
                  step="0.01"
                  {...register('min_price', { valueAsNumber: true })}
                  error={errors.min_price?.message}
                  placeholder="0.00"
                  min={0}
                />
                
                <Input
                  label="Max Price"
                  type="number"
                  step="0.01"
                  {...register('max_price', { valueAsNumber: true })}
                  error={errors.max_price?.message}
                  placeholder="100.00"
                  min={0}
                />
              </div>
            </div>

            {/* Trip Status */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Trip Status</h4>
              <Select
                {...register('status')}
                error={errors.status?.message}
                placeholder="All statuses"
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />
            </div>

            {/* Preferences */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Preferences</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Checkbox
                    label="Smoking Allowed"
                    {...register('smoking_allowed')}
                    error={errors.smoking_allowed?.message}
                  />
                  
                  <Checkbox
                    label="Pets Allowed"
                    {...register('pets_allowed')}
                    error={errors.pets_allowed?.message}
                  />
                </div>
                
                <div className="space-y-3">
                  <Select
                    label="Music Preference"
                    {...register('music_preference')}
                    error={errors.music_preference?.message}
                    placeholder="Any"
                    options={[
                      { value: 'yes', label: 'Music Welcome' },
                      { value: 'no', label: 'Prefer Quiet' },
                      { value: 'indifferent', label: 'No Preference' },
                    ]}
                  />
                  
                  <Select
                    label="Conversation Level"
                    {...register('conversation_level')}
                    error={errors.conversation_level?.message}
                    placeholder="Any"
                    options={[
                      { value: 'chatty', label: 'Chatty' },
                      { value: 'quiet', label: 'Quiet Ride' },
                      { value: 'indifferent', label: 'No Preference' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            type="submit"
            className="flex-1"
          >
            Apply Filters
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            className="flex-1 sm:flex-none"
          >
            Clear All
          </Button>
        </div>
      </form>
    </Card>
  );
}