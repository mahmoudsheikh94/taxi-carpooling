import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { requestService } from '../services/supabase/requests';
import type { TripRequest } from '../types';
import type { CreateRequestData, UpdateRequestData, RequestFilters } from '../services/supabase/requests';

interface RequestState {
  // Request data
  requests: TripRequest[];
  sentRequests: TripRequest[];
  receivedRequests: TripRequest[];
  currentRequest: TripRequest | null;
  
  // UI state
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    total: number;
    offset: number;
    hasMore: boolean;
  };
  
  // Filters
  filters: RequestFilters;
  
  // Real-time subscriptions
  subscriptions: Record<string, any>;
}

interface RequestActions {
  // Request operations
  createRequest: (data: CreateRequestData) => Promise<TripRequest | null>;
  updateRequest: (requestId: string, data: UpdateRequestData) => Promise<TripRequest | null>;
  deleteRequest: (requestId: string) => Promise<boolean>;
  
  // Convenience methods
  acceptRequest: (requestId: string, message?: string) => Promise<TripRequest | null>;
  declineRequest: (requestId: string, message?: string) => Promise<TripRequest | null>;
  cancelRequest: (requestId: string) => Promise<TripRequest | null>;
  
  // Data fetching
  getRequest: (requestId: string) => Promise<void>;
  getRequests: (filters?: RequestFilters, loadMore?: boolean) => Promise<void>;
  getUserRequests: (userId: string, type?: 'sent' | 'received' | 'all') => Promise<void>;
  refreshRequests: () => Promise<void>;
  
  // State management
  setCurrentRequest: (request: TripRequest | null) => void;
  setFilters: (filters: Partial<RequestFilters>) => void;
  clearError: () => void;
  reset: () => void;
  
  // Real-time subscriptions
  subscribeToUserRequests: (userId: string) => () => void;
  unsubscribeAll: () => void;
}

type RequestStore = RequestState & RequestActions;

const initialState: RequestState = {
  requests: [],
  sentRequests: [],
  receivedRequests: [],
  currentRequest: null,
  isLoading: false,
  isSending: false,
  error: null,
  pagination: {
    total: 0,
    offset: 0,
    hasMore: false,
  },
  filters: {},
  subscriptions: {},
};

export const useRequestStore = create<RequestStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      createRequest: async (data: CreateRequestData) => {
        set({ isSending: true, error: null });
        
        try {
          const { request, error } = await requestService.createRequest(data);
          
          if (error) {
            set({ error, isSending: false });
            return null;
          }
          
          if (request) {
            set(state => ({
              requests: [request, ...state.requests],
              sentRequests: [request, ...state.sentRequests],
              isSending: false,
              error: null,
            }));
          }
          
          return request;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to create request';
          set({ error, isSending: false });
          return null;
        }
      },

      updateRequest: async (requestId: string, data: UpdateRequestData) => {
        set({ isLoading: true, error: null });
        
        try {
          const { request, error } = await requestService.updateRequest(requestId, data);
          
          if (error) {
            set({ error, isLoading: false });
            return null;
          }
          
          if (request) {
            set(state => ({
              requests: state.requests.map(r => r.id === requestId ? request : r),
              sentRequests: state.sentRequests.map(r => r.id === requestId ? request : r),
              receivedRequests: state.receivedRequests.map(r => r.id === requestId ? request : r),
              currentRequest: state.currentRequest?.id === requestId ? request : state.currentRequest,
              isLoading: false,
              error: null,
            }));
          }
          
          return request;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update request';
          set({ error, isLoading: false });
          return null;
        }
      },

      deleteRequest: async (requestId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { success, error } = await requestService.deleteRequest(requestId);
          
          if (error) {
            set({ error, isLoading: false });
            return false;
          }
          
          if (success) {
            set(state => ({
              requests: state.requests.filter(r => r.id !== requestId),
              sentRequests: state.sentRequests.filter(r => r.id !== requestId),
              receivedRequests: state.receivedRequests.filter(r => r.id !== requestId),
              currentRequest: state.currentRequest?.id === requestId ? null : state.currentRequest,
              isLoading: false,
              error: null,
            }));
          }
          
          return success;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to delete request';
          set({ error, isLoading: false });
          return false;
        }
      },

      acceptRequest: async (requestId: string, message?: string) => {
        return get().updateRequest(requestId, { status: 'ACCEPTED', message });
      },

      declineRequest: async (requestId: string, message?: string) => {
        return get().updateRequest(requestId, { status: 'DECLINED', message });
      },

      cancelRequest: async (requestId: string) => {
        return get().updateRequest(requestId, { status: 'CANCELLED' });
      },

      getRequest: async (requestId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { request, error } = await requestService.getRequest(requestId);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          if (request) {
            set({ currentRequest: request, isLoading: false, error: null });
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to fetch request';
          set({ error, isLoading: false });
        }
      },

      getRequests: async (filters?: RequestFilters, loadMore = false) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentState = get();
          const effectiveFilters = { ...currentState.filters, ...filters };
          
          if (loadMore) {
            effectiveFilters.offset = currentState.pagination.offset;
          } else {
            effectiveFilters.offset = 0;
          }
          
          const { requests, total, error } = await requestService.getRequests(effectiveFilters);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set(state => ({
            requests: loadMore ? [...state.requests, ...requests] : requests,
            pagination: {
              total,
              offset: (effectiveFilters.offset || 0) + requests.length,
              hasMore: ((effectiveFilters.offset || 0) + requests.length) < total,
            },
            filters: effectiveFilters,
            isLoading: false,
            error: null,
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to fetch requests';
          set({ error, isLoading: false });
        }
      },

      getUserRequests: async (userId: string, type = 'all') => {
        set({ isLoading: true, error: null });
        
        try {
          const { requests, total, error } = await requestService.getUserRequests(userId, type);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          // Separate sent and received requests
          const sentRequests = requests.filter(r => r.sender_id === userId);
          const receivedRequests = requests.filter(r => r.receiver_id === userId);
          
          set({
            requests,
            sentRequests,
            receivedRequests,
            pagination: {
              total,
              offset: requests.length,
              hasMore: false, // User requests are typically not paginated
            },
            isLoading: false,
            error: null,
          });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to fetch user requests';
          set({ error, isLoading: false });
        }
      },

      refreshRequests: async () => {
        const { filters } = get();
        await get().getRequests(filters, false);
      },

      setCurrentRequest: (request: TripRequest | null) => {
        set({ currentRequest: request });
      },

      setFilters: (newFilters: Partial<RequestFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },

      subscribeToUserRequests: (userId: string) => {
        const unsubscribe = requestService.subscribeToUserRequests(
          userId,
          (request) => {
            set(state => {
              // Update or add the request in all relevant arrays
              const updateRequestInArray = (requests: TripRequest[]) => {
                const existingIndex = requests.findIndex(r => r.id === request.id);
                if (existingIndex >= 0) {
                  return requests.map(r => r.id === request.id ? request : r);
                } else {
                  return [request, ...requests];
                }
              };

              const updatedRequests = updateRequestInArray(state.requests);
              const updatedSentRequests = request.sender_id === userId 
                ? updateRequestInArray(state.sentRequests)
                : state.sentRequests;
              const updatedReceivedRequests = request.receiver_id === userId
                ? updateRequestInArray(state.receivedRequests)
                : state.receivedRequests;

              return {
                requests: updatedRequests,
                sentRequests: updatedSentRequests,
                receivedRequests: updatedReceivedRequests,
                currentRequest: state.currentRequest?.id === request.id ? request : state.currentRequest,
              };
            });
          },
          (error) => {
            set({ error: error.message });
          }
        );

        set(state => ({
          subscriptions: {
            ...state.subscriptions,
            [userId]: unsubscribe,
          },
        }));

        return unsubscribe;
      },

      unsubscribeAll: () => {
        const { subscriptions } = get();
        Object.values(subscriptions).forEach(unsubscribe => {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        });
        set({ subscriptions: {} });
      },
    }),
    {
      name: 'request-store',
      partialize: (state) => ({
        // Only persist essential data, not loading states
        requests: state.requests,
        sentRequests: state.sentRequests,
        receivedRequests: state.receivedRequests,
        filters: state.filters,
      }),
    }
  )
);