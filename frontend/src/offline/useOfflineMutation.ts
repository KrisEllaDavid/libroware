import { DocumentNode } from "graphql";
import {
  ApolloCache,
  MutationHookOptions,
  MutationTuple,
  OperationVariables,
  useApolloClient,
  useMutation,
} from "@apollo/client";
import { useNetwork } from "../context/NetworkContext";
import { useToast } from "../context/ToastContext";
import { enqueue, QueuedMutationType } from "./offlineQueue";

interface OfflineMutationConfig<TVariables> {
  /** Identifies the mutation in the offline queue so replayQueue knows how to replay it. */
  type: QueuedMutationType;
  /** Applies an immediate optimistic cache update so the UI reflects the action right away. */
  applyOptimistic: (cache: ApolloCache<object>, variables: TVariables) => void;
  /** Toast shown when the action is queued instead of sent. */
  queuedMessage: string;
}

interface OfflineMutationOptions<TData, TVariables extends OperationVariables>
  extends MutationHookOptions<TData, TVariables> {
  /** Called instead of onCompleted when the action is queued for later instead of sent immediately. */
  onQueued?: () => void;
}

/**
 * Wraps useMutation so that, when offline, the call applies an optimistic cache
 * update and enqueues the mutation for replay (via offline/replayQueue.ts) instead
 * of failing outright. Online behavior is an unmodified passthrough to useMutation.
 */
export function useOfflineMutation<TData = any, TVariables extends OperationVariables = OperationVariables>(
  mutation: DocumentNode,
  config: OfflineMutationConfig<TVariables>,
  options?: OfflineMutationOptions<TData, TVariables>
): [(args: { variables: TVariables }) => void, { loading: boolean }] {
  const { isOnline } = useNetwork();
  const client = useApolloClient();
  const { addToast } = useToast();
  const [mutate, { loading }]: MutationTuple<TData, TVariables> = useMutation<TData, TVariables>(mutation, options);

  const run = (args: { variables: TVariables }) => {
    if (isOnline) {
      mutate(args);
      return;
    }

    config.applyOptimistic(client.cache, args.variables);
    enqueue({ type: config.type, variables: args.variables as Record<string, any> });
    addToast(config.queuedMessage, "info");
    options?.onQueued?.();
  };

  return [run, { loading }];
}
