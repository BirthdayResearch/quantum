import { DOCUMENTATION_URL, FAQS_URL } from "../../src/constants";
import { BigNumber as BigEther, ethers } from "ethers";
import { Erc20Token } from "../../src/types";

export const LOCAL_BASE_ENDPOINT = "http://localhost:3000/";
export const LOCAL_DFC_ENDPOINT = "http://localhost:19553/v0";
export const HARDHAT_CHAINID = 1337;

export const QuantumHelperLinks = [
  {
    testId: "documentation-link",
    url: DOCUMENTATION_URL,
  },
  {
    testId: "faqs-link",
    url: FAQS_URL,
  },
];

export const MaintenanceSocialLinks = [
  {
    testId: "twitter",
    label: "Twitter (Birthday Research)",
    href: "https://twitter.com/BirthdayDev",
  },
  {
    testId: "gitHub",
    label: "GitHub (Birthday Research)",
    href: "https://github.com/BirthdayResearch",
  },
  {
    testId: "reddit",
    label: "Reddit (r/defiblockchain)",
    href: "https://www.reddit.com/r/defiblockchain",
  },
];

export enum UtilityButtonType {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

export interface TokenBalanceI {
  id: string;
  amount: string;
  symbol: string;
  symbolKey: string;
  name: string;
  isDAT: boolean;
  isLPS: boolean;
  isLoanToken: boolean;
  displaySymbol: string;
}
