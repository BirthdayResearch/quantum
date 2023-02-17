import { statusWebsiteSlice } from "./status";
import { bridgeApi } from "./website";

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
