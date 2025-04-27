declare module '@apollo/client' {
  import { ReactElement, ComponentType } from 'react';
  
  export interface ApolloClientOptions<TCacheShape> {
    uri?: string;
    cache: any;
    credentials?: string;
    headers?: Record<string, string>;
    link?: any;
  }
  
  export class ApolloClient<TCacheShape> {
    constructor(options: ApolloClientOptions<TCacheShape>);
    watchQuery: any;
    query: any;
    mutate: any;
    resetStore: () => Promise<any>;
    clearStore: () => Promise<any>;
    onResetStore: (cb: () => Promise<any>) => () => void;
    onClearStore: (cb: () => Promise<any>) => () => void;
  }
  
  export class InMemoryCache {
    constructor(options?: any);
  }
  
  export interface ProviderProps {
    client: ApolloClient<any>;
    children: ReactElement;
  }
  
  export const ApolloProvider: ComponentType<ProviderProps>;
  
  export interface QueryResult<TData = any> {
    data?: TData;
    error?: Error;
    loading: boolean;
    refetch: (variables?: any) => Promise<QueryResult<TData>>;
    fetchMore: any;
    startPolling: (interval: number) => void;
    stopPolling: () => void;
    networkStatus: number;
  }
  
  export interface MutationResult<TData = any> {
    data?: TData;
    error?: Error;
    loading: boolean;
    called: boolean;
    client?: ApolloClient<any>;
  }
  
  export interface MutationFunctionOptions {
    variables?: Record<string, any>;
    optimisticResponse?: Record<string, any>;
    refetchQueries?: Array<string | any>;
    update?: (cache: any, result: any) => void;
  }
  
  export type MutationFunction<TData = any> = (
    options?: MutationFunctionOptions
  ) => Promise<MutationResult<TData>>;
  
  export interface MutationHookOptions {
    variables?: Record<string, any>;
    onCompleted?: (data: any) => void;
    onError?: (error: Error) => void;
    refetchQueries?: Array<string | any>;
    update?: (cache: any, result: any) => void;
  }
  
  export function useQuery<TData = any, TVariables = any>(
    query: any,
    options?: {
      variables?: TVariables;
      fetchPolicy?: string;
      errorPolicy?: string;
      ssr?: boolean;
      skip?: boolean;
      onCompleted?: (data: TData) => void;
      onError?: (error: Error) => void;
    }
  ): QueryResult<TData>;
  
  export function useMutation<TData = any, TVariables = any>(
    mutation: any,
    options?: MutationHookOptions
  ): [MutationFunction<TData>, MutationResult<TData>];
  
  export function gql(strings: TemplateStringsArray, ...args: any[]): any;
}

declare module '@apollo/client/react' {
  export { useQuery, useMutation } from '@apollo/client';
} 