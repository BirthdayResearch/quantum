import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BridgeStatus } from "types";

// eslint-disable-next-line import/prefer-default-export
export const statusWebsiteSlice = createApi({
  reducerPath: "website",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://wallet.defichain.com/api/v0",
  }),
  endpoints: (builder) => ({
    getBridgeStatus: builder.query<BridgeStatus, any>({
      query: () => ({
        url: "/bridge/status",
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*",
          mode: "no-cors",
        },
      }),
    }),
  }),
});
