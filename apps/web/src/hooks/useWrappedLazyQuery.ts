import { BaseQueryFn } from "@reduxjs/toolkit/query";
import { UseLazyQuery } from "@reduxjs/toolkit/dist/query/react/buildHooks";
import { QueryDefinition } from "@reduxjs/toolkit/dist/query/react";
import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import BASE_URLS from "../config/networkUrl";

/**
 * Wrapper for UseLazyQuery function to inject NetworkEnvironmentContext and pass in `baseUrl` based on the current network
 * @param query
 */
const useWrappedLazyQuery = <U, V extends BaseQueryFn, W>(
  query: UseLazyQuery<QueryDefinition<U, V, never, W, string>>
): ReturnType<UseLazyQuery<QueryDefinition<U, V, never, W, string>>> => {
  const [trigger, result, lastPromiseInfo] = query();
  const { networkEnv } = useNetworkEnvironmentContext();

  const triggerWrapper = (args) =>
    trigger({ baseUrl: BASE_URLS[networkEnv], ...args });
  return [triggerWrapper, result, lastPromiseInfo];
};

export default useWrappedLazyQuery;
