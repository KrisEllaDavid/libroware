import { ApolloClient, InMemoryCache, ApolloClientOptions, NormalizedCacheObject } from '@apollo/client';
import { from } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ServerError } from '@apollo/client/link/utils';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';
import { getApiUrl } from './config/api';

// Dispatched whenever a request fails because the session is no longer valid
// (expired/invalid token). AuthContext listens for this to force a logout and
// send the user back to the login screen instead of leaving the UI idle.
export const AUTH_EXPIRED_EVENT = 'libroware:auth-expired';

const isAuthError = (message: string) =>
  /not authenticated|not authorized|jwt expired|invalid token/i.test(message);

const errorLink = onError(({ graphQLErrors, networkError }) => {
  let authExpired = false;

  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, path }) => {
      console.error(`[GraphQL error]: ${message}, Path: ${path}`);
      if (isAuthError(message)) authExpired = true;
    });
  }

  if (networkError) {
    console.error(`[Network error]:`, networkError);
    const statusCode = (networkError as ServerError).statusCode;
    if (statusCode) {
      console.error(`Status code: ${statusCode}`);
      if (statusCode === 401 || statusCode === 403) authExpired = true;
    }
  }

  if (authExpired) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
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
