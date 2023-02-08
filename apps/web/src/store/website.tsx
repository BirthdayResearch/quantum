import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import { AddressDetails } from "types";

const staggeredBaseQuery = retry(
  fetchBaseQuery({
    baseUrl: process.env.BRIDGE_API_URL || "http://localhost:5741/defichain",
  }),
  {
    maxRetries: 0,
  }
);

export const bridgeApi = createApi({
  reducerPath: "website",
  baseQuery: staggeredBaseQuery,
  endpoints: (builder) => ({
    generateAddress: builder.mutation<AddressDetails, any>({
      query: ({ network, refundAddress }) => ({
        url: "/wallet/address/generate",
        params: { network, refundAddress },
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json; charset=UTF-8",
        },
      }),
      extraOptions: { maxRetries: 3 },
    }),
    getAddressDetail: builder.mutation<AddressDetails, any>({
      query: ({ network, address }) => ({
        url: `/wallet/address/${address}`,
        params: { network },
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json; charset=UTF-8",
        },
      }),
      extraOptions: { maxRetries: 3 },
    }),
  }),
});

const { useGenerateAddressMutation, useGetAddressDetailMutation } = bridgeApi;

export { useGenerateAddressMutation, useGetAddressDetailMutation };
