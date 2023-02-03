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
  reducerPath: "website",
  baseQuery: staggeredBaseQuery,
  endpoints: (builder) => ({
    generateAddress: builder.mutation<{ address: string }, any>({
      query: ({ network }) => ({
        url: "/wallet/address/generate",
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

const { useGenerateAddressMutation } = bridgeApi;

export { useGenerateAddressMutation };
