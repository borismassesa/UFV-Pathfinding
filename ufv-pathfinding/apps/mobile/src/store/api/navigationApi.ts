import { baseApi } from './baseApi';
import type { 
  Room, 
  Building, 
  Route, 
  NavigationNode, 
  SearchResult,
  UserPreferences,
  BeaconData 
} from '../../types';

export const navigationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Buildings
    getBuildings: builder.query<Building[], void>({
      query: () => '/buildings',
      providesTags: ['Building'],
    }),
    
    getBuilding: builder.query<Building, string>({
      query: (id) => `/buildings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Building', id }],
    }),
    
    // Rooms
    getRooms: builder.query<Room[], { buildingId?: string; floor?: number }>({
      query: ({ buildingId, floor }) => {
        const params = new URLSearchParams();
        if (buildingId) params.append('buildingId', buildingId);
        if (floor !== undefined) params.append('floor', floor.toString());
        return `/rooms?${params.toString()}`;
      },
      providesTags: ['Room'],
    }),
    
    getRoom: builder.query<Room, string>({
      query: (id) => `/rooms/${id}`,
      providesTags: (result, error, id) => [{ type: 'Room', id }],
    }),
    
    searchRooms: builder.query<SearchResult[], string>({
      query: (query) => `/rooms/search?q=${encodeURIComponent(query)}`,
      providesTags: ['Room'],
    }),
    
    // Navigation
    calculateRoute: builder.mutation<Route, {
      from: string;
      to: string;
      preferences?: UserPreferences;
    }>({
      query: ({ from, to, preferences }) => ({
        url: '/navigation/route',
        method: 'POST',
        body: { from, to, preferences },
      }),
      invalidatesTags: ['Route'],
    }),
    
    getNavigationNodes: builder.query<NavigationNode[], {
      buildingId: string;
      floor?: number;
    }>({
      query: ({ buildingId, floor }) => {
        const params = new URLSearchParams({ buildingId });
        if (floor !== undefined) params.append('floor', floor.toString());
        return `/navigation/nodes?${params.toString()}`;
      },
      providesTags: ['NavigationNode'],
    }),
    
    // Indoor Positioning
    getBeacons: builder.query<BeaconData[], { buildingId: string; floor?: number }>({
      query: ({ buildingId, floor }) => {
        const params = new URLSearchParams({ buildingId });
        if (floor !== undefined) params.append('floor', floor.toString());
        return `/beacons?${params.toString()}`;
      },
      providesTags: ['BeaconData'],
    }),
    
    updateUserLocation: builder.mutation<void, {
      coordinates: { lat: number; lng: number };
      floor: number;
      building: string;
      accuracy: number;
      source: string;
    }>({
      query: (locationData) => ({
        url: '/navigation/location',
        method: 'POST',
        body: locationData,
      }),
    }),
    
    // Favorites
    getFavoriteRooms: builder.query<Room[], void>({
      query: () => '/user/favorites',
      providesTags: ['Room'],
    }),
    
    addFavoriteRoom: builder.mutation<void, string>({
      query: (roomId) => ({
        url: `/user/favorites/${roomId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Room'],
    }),
    
    removeFavoriteRoom: builder.mutation<void, string>({
      query: (roomId) => ({
        url: `/user/favorites/${roomId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Room'],
    }),
    
    // Analytics
    trackNavigation: builder.mutation<void, {
      eventType: string;
      data: Record<string, any>;
    }>({
      query: (eventData) => ({
        url: '/analytics/track',
        method: 'POST',
        body: eventData,
      }),
    }),
  }),
});

export const {
  useGetBuildingsQuery,
  useGetBuildingQuery,
  useGetRoomsQuery,
  useGetRoomQuery,
  useSearchRoomsQuery,
  useCalculateRouteMutation,
  useGetNavigationNodesQuery,
  useGetBeaconsQuery,
  useUpdateUserLocationMutation,
  useGetFavoriteRoomsQuery,
  useAddFavoriteRoomMutation,
  useRemoveFavoriteRoomMutation,
  useTrackNavigationMutation,
} = navigationApi;