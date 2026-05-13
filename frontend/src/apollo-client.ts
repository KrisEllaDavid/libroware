import { ApolloClient, InMemoryCache, ApolloClientOptions, NormalizedCacheObject } from '@apollo/client';
import { from } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ServerError } from '@apollo/client/link/utils';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';
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
      // Return cached data immediately and fetch from network in background.
      // If offline, the network fetch fails silently but the cached data is still served.
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

// Hydrate the Apollo cache from IndexedDB before the first render.
// apollo3-cache-persist also watches the cache and auto-saves every write going forward.
export const initCache = async (): Promise<void> => {
  try {
    await persistCache({
      cache,
      storage: new LocalStorageWrapper(window.localStorage),
    });
  } catch (err) {
    console.error('Apollo cache persistence init failed:', err);
  }
};
