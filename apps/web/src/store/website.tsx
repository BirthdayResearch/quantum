import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";

const staggeredBaseQuery = retry(
  fetchBaseQuery({
    baseUrl: process.env.BRIDGE_API_URL || "http://localhost:5741/defichain",
  }),
  {
    maxRetries: 0,
  }
);

export const bridgeApi = createApi({
  reducerPath: "defichain",
  baseQuery: staggeredBaseQuery,
  endpoints: (builder) => ({
    generateAddress: builder.mutation<{ address: string }, any>({
      query: ({ network }) => ({
        url: "/wallet/generate-address",
        params: { network },
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json; charset=UTF-8",
        },
      }),
      extraOptions: { maxRetries: 3 },
    }),
    verify: builder.query<
      any,
      {
        network: string;
        address: string;
        amount: string;
        symbol: string;
      }
    >({
      query: ({ network, address, amount, symbol }) => ({
        url: "/wallet/verify",
        params: { network },
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: {
          address,
          amount,
          symbol,
        },
      }),
    }),
  }),
});

const { useGenerateAddressMutation, useLazyVerifyQuery } = bridgeApi;

export { useGenerateAddressMutation, useLazyVerifyQuery };
