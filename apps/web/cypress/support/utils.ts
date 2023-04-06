import { DOCUMENTATION_URL, FAQS_URL } from "../../src/constants";

export const LOCAL_BASE_URL = "http://localhost:3000/";
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
