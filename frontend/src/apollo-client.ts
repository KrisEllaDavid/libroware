import { ApolloClient, InMemoryCache, ApolloClientOptions } from '@apollo/client';
import { from } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Get API URL from environment variables and ensure it's properly formatted
const API_URL = "/api/graphql";

if (!API_URL) {
  console.error('VITE_API_URL environment variable is not set');
}

// Log the API URL for debugging
console.log('Using Apollo API URL:', API_URL);

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, response }) => {
  console.log('🔍 Apollo operation error details:');
  console.log('- Operation:', operation.operationName);
  console.log('- Variables:', JSON.stringify(operation.variables));
  console.log('- Request URL:', operation.getContext().uri);
  
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(`❌ [GraphQL error]: Message: ${message}, Path: ${path}`);
      console.error('  Locations:', JSON.stringify(locations));
      console.error('  Extensions:', JSON.stringify(extensions));
    });
  }
  
  if (networkError) {
    console.error(`❌ [Network error]:`, networkError);
    // @ts-ignore
    if (networkError.statusCode) {
      // @ts-ignore
      console.error(`  Status code: ${networkError.statusCode}`);
    }
  }
  
  if (response) {
    console.log('  Response:', response);
  }
});

// Add a link to always send the x-apollo-operation-name header
const operationNameLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    'x-apollo-operation-name': 'default',
  }
}));

// Create an http link with proper configuration
const httpLink = new HttpLink({
  uri: API_URL,
  credentials: 'include',
  fetch: (uri, options) => {
    // Log the actual request URL
    console.log('Making request to:', uri);
    return fetch(uri, options);
  }
});

// Auth link to set the authorization header
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

// Create Apollo client with appropriate configuration
const clientOptions = {
  link: from([errorLink, operationNameLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only' as const, 
      errorPolicy: 'all' as const,
    },
    query: {
      fetchPolicy: 'network-only' as const,
      errorPolicy: 'all' as const,
    },
    mutate: {
      fetchPolicy: 'no-cache' as const,
      errorPolicy: 'all' as const,
    },
  }
};

export const client = new ApolloClient(clientOptions as any); 