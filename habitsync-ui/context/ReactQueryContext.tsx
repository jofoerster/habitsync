import React, { useEffect } from 'react';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Configure React Query's online manager to use NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnReconnect: true,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 60 * 24 * 30,
      // Enable network mode that allows queries to work offline with cached data
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      // Most mutations should only work online, but we'll override for habit records
      networkMode: 'online',
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  throttleTime: 1000,
});

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist queries that are useful for offline access
            // Persist habit-related queries for offline functionality
            const queryKey = query.queryKey[0] as string;
            return queryKey === 'habits' || queryKey === 'percentage-history';
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

export { queryClient };

