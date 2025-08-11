import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsApi, isGoogleMapsAvailable } from '../../services/maps';
import { Input } from '../ui';
import type { LocationData } from '../../types';

interface PlacesAutocompleteProps {
  value?: string;
  onChange?: (value: string, location?: LocationData) => void;
  onPlaceSelect?: (location: LocationData) => void; // New callback for location selection
  onError?: (error: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  countries?: string[];
  types?: string[];
  disabled?: boolean;
}

export function PlacesAutocomplete({
  value = '',
  onChange,
  onPlaceSelect,
  onError,
  placeholder = 'Enter a location',
  error,
  label,
  required,
  className,
  countries = [],
  types = ['geocode'],
  disabled = false,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGoogleMaps, setHasGoogleMaps] = useState(true);
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    // Skip initialization if Google Maps is not available
    if (!isGoogleMapsAvailable()) {
      console.warn('Google Maps API not available, using fallback input');
      setHasGoogleMaps(false);
      return;
    }

    const initAutocomplete = async () => {
      if (!inputRef.current) {
        console.warn('PlacesAutocomplete: Input ref not available');
        return;
      }

      try {
        setIsLoading(true);
        await loadGoogleMapsApi();

        // Verify that the input element is still valid
        if (!inputRef.current || !(inputRef.current instanceof HTMLInputElement)) {
          console.error('PlacesAutocomplete: Invalid input element reference');
          setHasGoogleMaps(false);
          onError?.('Location autocomplete initialization failed - input element not found');
          return;
        }

        const options: google.maps.places.AutocompleteOptions = {
          types,
          fields: [
            'place_id',
            'formatted_address',
            'geometry.location',
            'name',
            'types',
            'address_components',
          ],
        };

        if (countries.length > 0) {
          options.componentRestrictions = { country: countries };
        }

        const autocomplete = new google.maps.places.Autocomplete(
          inputRef.current,
          options
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place.geometry?.location) {
            onError?.('Please select a valid location from the dropdown');
            return;
          }

          const location: LocationData = {
            address: place.formatted_address || '',
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
            placeId: place.place_id || '',
            name: place.name,
            types: place.types,
          };

          const formattedAddress = place.formatted_address || '';
          setInternalValue(formattedAddress);
          
          // Call both callbacks if they exist
          onChange?.(formattedAddress, location);
          onPlaceSelect?.(location);
        });

        autocompleteRef.current = autocomplete;
      } catch (err) {
        console.error('Failed to initialize Places Autocomplete:', err);
        setHasGoogleMaps(false);
        onError?.('Location autocomplete unavailable - you can still enter addresses manually');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure DOM is fully ready
    const timeoutId = setTimeout(() => {
      initAutocomplete();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [countries, types, onError]);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        label={label}
        value={internalValue}
        onChange={handleInputChange}
        placeholder={
          isLoading 
            ? 'Loading location services...' 
            : hasGoogleMaps 
              ? placeholder 
              : `${placeholder} (manual entry)`
        }
        error={error}
        required={required}
        disabled={isLoading || disabled}
        autoComplete="off"
      />
    </div>
  );
}