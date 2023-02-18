import { statusWebsiteSlice } from "./status";
import { bridgeApi } from "./defichain";

const {
  useGenerateAddressMutation,
  useLazyVerifyQuery,
  useGetAddressDetailMutation,
} = bridgeApi;

const { useGetBridgeStatusQuery } = statusWebsiteSlice;

export {
  useGetBridgeStatusQuery,
  useGenerateAddressMutation,
  useLazyVerifyQuery,
  useGetAddressDetailMutation,
  bridgeApi,
  statusWebsiteSlice,
};
