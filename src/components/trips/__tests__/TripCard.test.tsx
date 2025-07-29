import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { TripCard } from '../TripCard';
import { mockTrip, mockUser } from '../../../test/utils';

// Mock the store hooks
vi.mock('../../../store', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
  })),
  useToastStore: vi.fn(() => ({
    addToast: vi.fn(),
  })),
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock date formatting
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM dd, yyyy') return 'Dec 30, 2024';
    if (formatStr === 'HH:mm') return '10:00';
    return 'formatted-date';
  }),
  isAfter: vi.fn(() => true),
}));

describe('TripCard Component', () => {
  const defaultProps = {
    trip: mockTrip,
    onTripUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render trip information correctly', () => {
    render(<TripCard {...defaultProps} />);
    
    // Should show pickup and dropoff locations
    expect(screen.getByText(mockTrip.pickup_location.address)).toBeInTheDocument();
    expect(screen.getByText(mockTrip.dropoff_location.address)).toBeInTheDocument();
    
    // Should show departure time
    expect(screen.getByText('Dec 30, 2024')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    
    // Should show price
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    
    // Should show passenger information
    expect(screen.getByText('1/3 passengers')).toBeInTheDocument();
    
    // Should show user name
    expect(screen.getByText(mockTrip.user.name)).toBeInTheDocument();
  });

  it('should show trip description when provided', () => {
    const tripWithDescription = {
      ...mockTrip,
      description: 'Airport trip, comfortable ride',
    };
    
    render(<TripCard trip={tripWithDescription} onTripUpdate={vi.fn()} />);
    
    expect(screen.getByText('Airport trip, comfortable ride')).toBeInTheDocument();
  });

  it('should not show description when empty', () => {
    const tripWithoutDescription = {
      ...mockTrip,
      description: '',
    };
    
    render(<TripCard trip={tripWithoutDescription} onTripUpdate={vi.fn()} />);
    
    // Description section should not be rendered
    expect(screen.queryByText('Airport trip, comfortable ride')).not.toBeInTheDocument();
  });

  it('should show "Join Trip" button for other users trips', () => {
    const otherUserTrip = {
      ...mockTrip,
      user_id: 'different-user-id',
      user: {
        ...mockUser,
        id: 'different-user-id',
        name: 'Other User',
      },
    };
    
    render(<TripCard trip={otherUserTrip} onTripUpdate={vi.fn()} />);
    
    expect(screen.getByText('Join Trip')).toBeInTheDocument();
  });

  it('should show "Edit" and "Cancel" buttons for own trips', () => {
    render(<TripCard {...defaultProps} />);
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Cancel Trip')).toBeInTheDocument();
  });

  it('should handle join trip action', () => {
    const otherUserTrip = {
      ...mockTrip,
      user_id: 'different-user-id',
      user: {
        ...mockUser,
        id: 'different-user-id',
        name: 'Other User',
      },
    };
    
    render(<TripCard trip={otherUserTrip} onTripUpdate={vi.fn()} />);
    
    const joinButton = screen.getByText('Join Trip');
    fireEvent.click(joinButton);
    
    // Should show join modal or navigate to join page
    // This depends on your implementation
  });

  it('should handle edit trip action', () => {
    render(<TripCard {...defaultProps} />);
    
    const editButton = screen.getByText('Edit');
    expect(editButton.closest('a')).toHaveAttribute('href', `/trips/${mockTrip.id}/edit`);
  });

  it('should handle cancel trip action', () => {
    const onTripUpdate = vi.fn();
    render(<TripCard trip={mockTrip} onTripUpdate={onTripUpdate} />);
    
    const cancelButton = screen.getByText('Cancel Trip');
    fireEvent.click(cancelButton);
    
    // Should show confirmation dialog or call onTripUpdate
    // This depends on your implementation
  });

  it('should show trip status correctly', () => {
    const activeTrip = { ...mockTrip, status: 'ACTIVE' as const };
    const { rerender } = render(<TripCard trip={activeTrip} onTripUpdate={vi.fn()} />);
    
    // Active trips should show normal styling
    expect(screen.getByTestId('trip-card')).not.toHaveClass('opacity-50');
    
    const cancelledTrip = { ...mockTrip, status: 'CANCELLED' as const };
    rerender(<TripCard trip={cancelledTrip} onTripUpdate={vi.fn()} />);
    
    // Cancelled trips should show muted styling
    expect(screen.getByTestId('trip-card')).toHaveClass('opacity-50');
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });

  it('should show passenger count with different states', () => {
    const fullTrip = {
      ...mockTrip,
      current_passengers: 3,
      max_passengers: 3,
    };
    
    render(<TripCard trip={fullTrip} onTripUpdate={vi.fn()} />);
    
    expect(screen.getByText('3/3 passengers')).toBeInTheDocument();
    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('should handle loading states', () => {
    render(<TripCard {...defaultProps} isLoading />);
    
    // Should show loading indicators
    const card = screen.getByTestId('trip-card');
    expect(card).toHaveClass('animate-pulse');
  });

  it('should show user avatar or initials', () => {
    const userWithAvatar = {
      ...mockUser,
      avatar_url: 'https://example.com/avatar.jpg',
    };
    
    const tripWithAvatar = {
      ...mockTrip,
      user: userWithAvatar,
    };
    
    const { rerender } = render(<TripCard trip={tripWithAvatar} onTripUpdate={vi.fn()} />);
    
    // Should show avatar image
    expect(screen.getByRole('img', { name: userWithAvatar.name })).toBeInTheDocument();
    
    // Test fallback to initials
    const userWithoutAvatar = {
      ...mockUser,
      avatar_url: null,
    };
    
    const tripWithoutAvatar = {
      ...mockTrip,
      user: userWithoutAvatar,
    };
    
    rerender(<TripCard trip={tripWithoutAvatar} onTripUpdate={vi.fn()} />);
    
    // Should show user initials
    expect(screen.getByText('TU')).toBeInTheDocument(); // Test User initials
  });

  it('should show price per person correctly formatted', () => {
    const expensiveTrip = {
      ...mockTrip,
      price_per_person: 125.50,
    };
    
    render(<TripCard trip={expensiveTrip} onTripUpdate={vi.fn()} />);
    
    expect(screen.getByText('$125.50')).toBeInTheDocument();
  });

  it('should handle very long addresses gracefully', () => {
    const tripWithLongAddress = {
      ...mockTrip,
      pickup_location: {
        address: 'Very Long Street Name That Should Be Truncated Because It Is Too Long For Display, City, State, Country',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
    };
    
    render(<TripCard trip={tripWithLongAddress} onTripUpdate={vi.fn()} />);
    
    // Should still render the address (truncation handled by CSS)
    const addressElement = screen.getByText(tripWithLongAddress.pickup_location.address);
    expect(addressElement).toBeInTheDocument();
    expect(addressElement).toHaveClass('truncate');
  });

  it('should be accessible', () => {
    render(<TripCard {...defaultProps} />);
    
    const card = screen.getByTestId('trip-card');
    
    // Should have proper ARIA attributes
    expect(card).toHaveAttribute('role', 'article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Trip from'));
    
    // Buttons should be keyboard accessible
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  it('should handle missing trip data gracefully', () => {
    const incompleteTrip = {
      ...mockTrip,
      pickup_location: null,
      dropoff_location: null,
      user: null,
    };
    
    // Should not crash when rendering incomplete data
    expect(() => {
      render(<TripCard trip={incompleteTrip} onTripUpdate={vi.fn()} />);
    }).not.toThrow();
  });

  it('should show correct time format for different locales', () => {
    // This would test internationalization if implemented
    render(<TripCard {...defaultProps} />);
    
    // For now, just verify the time is displayed
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('should handle click events on the card', () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
    
    render(<TripCard {...defaultProps} />);
    
    const card = screen.getByTestId('trip-card');
    fireEvent.click(card);
    
    // Should navigate to trip details
    expect(mockNavigate).toHaveBeenCalledWith(`/trips/${mockTrip.id}`);
  });
});