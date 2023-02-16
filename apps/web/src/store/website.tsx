import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import { FetchArgs } from "@reduxjs/toolkit/dist/query/fetchBaseQuery";
import { AddressDetails } from "types";
import { HttpStatusCode } from "axios";

const staggeredBaseQueryWithBailOut = retry(
  async (args: string | FetchArgs, api, extraOptions) => {
    const result = await fetchBaseQuery({
      baseUrl: process.env.BRIDGE_API_URL || "http://localhost:5741/defichain",
    })(args, api, extraOptions);
    // bail out of re-tries if TooManyRequests,
    // because we know successive re-retries would be redundant
    if (result.error?.status === HttpStatusCode.TooManyRequests) {
      retry.fail(result.error);
    }
    return result;
  },
  {
    maxRetries: 0,
  }
);

export const bridgeApi = createApi({
  reducerPath: "defichain",
  baseQuery: staggeredBaseQueryWithBailOut,
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
        body: {
          address,
          amount,
          symbol,
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
      extraOptions: { maxRetries: 1 },
    }),
  }),
});

const {
  useGenerateAddressMutation,
  useLazyVerifyQuery,
  useGetAddressDetailMutation,
} = bridgeApi;

export {
  useGenerateAddressMutation,
  useLazyVerifyQuery,
  useGetAddressDetailMutation,
};
