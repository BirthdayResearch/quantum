import useWrappedMutation from "@hooks/useWrappedMutation";
import useWrappedLazyQuery from "@hooks/useWrappedLazyQuery";

import { statusWebsiteSlice } from "./status";
import { bridgeApi } from "./defichain";

const useGenerateAddressMutation = () =>
  useWrappedMutation(bridgeApi.useGenerateAddressMutation);
const useLazyVerifyQuery = () =>
  useWrappedLazyQuery(bridgeApi.useLazyVerifyQuery);
const useGetAddressDetailMutation = () =>
  useWrappedMutation(bridgeApi.useGetAddressDetailMutation);

const { useGetBridgeStatusQuery } = statusWebsiteSlice;

export {
  useGetBridgeStatusQuery,
  useGenerateAddressMutation,
  useLazyVerifyQuery,
  useGetAddressDetailMutation,
  bridgeApi,
  statusWebsiteSlice,
};
