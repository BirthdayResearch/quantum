import { EnvironmentNetwork } from "@waveshq/walletkit-core";

// TODO: Replace URLs with real URLs
const BASE_URLS: { [key in EnvironmentNetwork]: string } = {
  [EnvironmentNetwork.LocalPlayground]: "http://localhost:5741",
  [EnvironmentNetwork.RemotePlayground]:
    "https://dihwwizbqe.eu-west-1.awsapprunner.com",
  [EnvironmentNetwork.TestNet]: "http://localhost:5741",
  [EnvironmentNetwork.DevNet]: "http://localhost:5741",
  [EnvironmentNetwork.MainNet]: "http://localhost:5741",
};

export const DEFICHAIN_WALLET_URL = "https://wallet.defichain.com/api/v0";

export default BASE_URLS;
