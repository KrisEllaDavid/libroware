import { ApolloClient, InMemoryCache, ApolloClientOptions, NormalizedCacheObject } from '@apollo/client';
import { from } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ServerError } from '@apollo/client/link/utils';
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

const clientOptions: ApolloClientOptions<NormalizedCacheObject> = {
  link: from([errorLink, operationNameLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  }
};

export const client = new ApolloClient(clientOptions);
