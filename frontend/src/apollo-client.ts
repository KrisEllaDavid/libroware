import { ApolloClient, InMemoryCache, ApolloClientOptions, NormalizedCacheObject } from '@apollo/client';
import { from } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ServerError } from '@apollo/client/link/utils';
import { persistCache, IndexedDBWrapper } from 'apollo3-cache-persist';
import { getApiUrl } from './config/api';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, path }) => {
      console.error(`[GraphQL error]: ${message}, Path: ${path}`);
    });
  }

  if (networkError) {
    console.error(`[Network error]:`, networkError);
    if ((networkError as ServerError).statusCode) {
      console.error(`Status code: ${(networkError as ServerError).statusCode}`);
    }
  }
});

const operationNameLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    'x-apollo-operation-name': 'default',
  }
}));

const httpLink = new HttpLink({
  uri: getApiUrl,
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : "",
    }
  };
});

export const cache = new InMemoryCache();

const clientOptions: ApolloClientOptions<NormalizedCacheObject> = {
  link: from([errorLink, operationNameLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      // Return cached data immediately and update in background when online.
      // When offline, the network fetch fails silently but cached data is still shown.
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  }
};

export const client = new ApolloClient(clientOptions);

// Call once at app startup to hydrate the Apollo cache from IndexedDB.
// The splash screen buys enough time for this to complete before any queries fire.
export const initCache = async (): Promise<void> => {
  try {
    await persistCache({
      cache,
      storage: new IndexedDBWrapper('libroware-apollo-cache'),
    });
  } catch (err) {
    console.error('Apollo cache persistence init failed:', err);
  }
};
