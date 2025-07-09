import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

const baseQuery = fetchBaseQuery({
  baseUrl: __DEV__ ? 'http://192.168.1.24:3000/api/v1' : 'https://api.ufv-pathfinding.com/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User', 
    'Room', 
    'Building', 
    'Route', 
    'NavigationNode', 
    'BeaconData',
    'Analytics'
  ],
  endpoints: () => ({}),
});

export const { 
  middleware: apiMiddleware,
  reducerPath: apiReducerPath,
  reducer: apiReducer 
} = baseApi;