import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import { FetchArgs } from "@reduxjs/toolkit/dist/query/fetchBaseQuery";
import { AddressDetails } from "types";
import { HttpStatusCode } from "axios";

const staggeredBaseQueryWithBailOut = retry(
  async (args: string | FetchArgs, api, extraOptions) => {
    const result = await fetchBaseQuery()(args, api, extraOptions);
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

// eslint-disable-next-line import/prefer-default-export
export const bridgeApi = createApi({
  reducerPath: "defichain",
  baseQuery: staggeredBaseQueryWithBailOut,
  endpoints: (builder) => ({
    generateAddress: builder.mutation<AddressDetails, any>({
      query: ({ baseUrl, refundAddress }) => ({
        url: `${baseUrl}/defichain/wallet/address/generate`,
        params: { refundAddress },
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
        baseUrl?: string;
        address: string;
        amount: string;
        symbol: string;
      }
    >({
      query: ({ baseUrl, address, amount, symbol }) => ({
        url: `${baseUrl}/defichain/wallet/verify`,
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
      query: ({ baseUrl, address }) => ({
        url: `${baseUrl}/defichain/wallet/address/${address}`,
        method: "GET",
      }),
      extraOptions: { maxRetries: 1 },
    }),
    confirmEthTxn: builder.mutation<
      { numberOfConfirmations: string; isConfirmed: boolean },
      any
    >({
      query: ({ baseUrl, txnHash }) => ({
        url: `${baseUrl}/ethereum/handleTransaction`,
        body: {
          transactionHash: txnHash,
        },
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json; charset=UTF-8",
        },
      }),
      extraOptions: { maxRetries: 0 },
    }),
  }),
});
