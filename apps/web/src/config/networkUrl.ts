// import { EnvironmentNetwork } from "@waveshq/walletkit-core";

enum EnvironmentNetwork {
  LocalPlayground = "Local",
  MainNet = "MainNet",
  TestNet = "TestNet",
  DevNet = "DevNet",
}

// TODO: Replace URLs with real URLs
const BASE_URLS: { [key in EnvironmentNetwork]: string } = {
  // Temp remove for Testnet environment
  [EnvironmentNetwork.LocalPlayground]: "http://localhost:5741",
  // [EnvironmentNetwork.RemotePlayground]:
  //   "https://dihwwizbqe.eu-west-1.awsapprunner.com",
  [EnvironmentNetwork.TestNet]: "https://sejzgjmns5.eu-west-1.awsapprunner.com",
  [EnvironmentNetwork.DevNet]: "http://localhost:5741",
  [EnvironmentNetwork.MainNet]: "https://nm5sgb3mzq.eu-west-1.awsapprunner.com",
};

export const DEFICHAIN_WALLET_URL = "https://wallet.defichain.com/api/v0";

export default BASE_URLS;
