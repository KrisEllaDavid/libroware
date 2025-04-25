import { ApolloClient, InMemoryCache } from '@apollo/client';
import { from } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Get API URL from environment variables or use a proxy path
const API_URL = import.meta.env.VITE_API_URL || '/graphql';

console.log('Using Apollo API URL:', API_URL);

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, response }) => {
  console.log('🔍 Apollo operation error details:');
  console.log('- Operation:', operation.operationName);
  console.log('- Variables:', JSON.stringify(operation.variables));
  
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

// Create an http link
const httpLink = new HttpLink({
  uri: API_URL,
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

// Create Apollo client
export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
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
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
}); 