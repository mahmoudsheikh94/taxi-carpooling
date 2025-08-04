import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsApi, isGoogleMapsAvailable } from '../../services/maps';
import { Input } from '../ui';
import type { LocationFormData } from '../../utils/validations';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, location?: LocationFormData) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  countries?: string[];
  types?: string[];
}

export function PlacesAutocomplete({
  value,
  onChange,
  onError,
  placeholder = 'Enter a location',
  error,
  label,
  required,
  className,
  countries = [],
  types = ['geocode'],
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGoogleMaps, setHasGoogleMaps] = useState(true);

  useEffect(() => {
    // Skip initialization if Google Maps is not available
    if (!isGoogleMapsAvailable()) {
      console.warn('Google Maps API not available, using fallback input');
      setHasGoogleMaps(false);
      return;
    }

    const initAutocomplete = async () => {
      if (!inputRef.current) return;

      try {
        setIsLoading(true);
        await loadGoogleMapsApi();

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

          const location: LocationFormData = {
            address: place.formatted_address || '',
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
            placeId: place.place_id || '',
            name: place.name,
            types: place.types,
          };

          onChange(place.formatted_address || '', location);
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

    initAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [countries, types, onError]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        label={label}
        value={value}
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
        disabled={isLoading}
        autoComplete="off"
      />
    </div>
  );
}