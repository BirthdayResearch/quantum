import React from "react";
import { FaReddit, FaGithub, FaTwitter } from "react-icons/fa";
import { BsMedium } from "react-icons/bs";
import Image from "next/image";
import Socials from "./commons/Socials";

const DeFiChainSocialItems = [
  {
    icon: FaTwitter,
    testId: "twitter_dfc",
    label: "Twitter",
    href: "https://twitter.com/defichain",
  },
  {
    icon: FaReddit,
    testId: "reddit_dfc",
    label: "Reddit",
    href: "https://www.reddit.com/r/defiblockchain",
  },
  {
    icon: FaGithub,
    testId: "gitHub_dfc",
    label: "GitHub",
    href: "https://github.com/DeFiCh",
  },
];
const BirthdayResearchSocialItems = [
  {
    icon: FaTwitter,
    testId: "twitter_br",
    label: "Twitter",
    href: "https://twitter.com/BirthdayDev/",
  },
  {
    icon: BsMedium,
    testId: "medium_br",
    label: "Medium",
    href: "https://medium.com/@birthdayresearch",
  },
  {
    icon: FaGithub,
    testId: "gitHub_br",
    label: "GitHub",
    href: "https://github.com/BirthdayResearch",
  },
];

export default function Footer() {
  const [version, setVersion] = React.useState("");
  React.useEffect(() => {
    fetch("http://localhost:5741/version")
      .then((response) => response.json())
      .then((data) => setVersion(data.v))
      .catch((error) => console.error("Error fetching version:", error));
  }, []);
  return (
    <footer
      data-testid="footer"
      className="relative z-[1] w-full border-dark-300 pt-8 bg-gradient-to-r from-[#00000066] to-[#00000000]"
    >
      <section
        data-testid="footer_web"
        className="text-dark-900 xs:px-[24px] px-5 pb-[51px] md:px-[48px] lg:px-[120px] lg:pb-[34px] text-sm"
      >
        <div className="border-t-[0.5px] border-dark-300 pb-[17.5px] pt-[15px]">
          <div className="relative h-[28px] w-[250px] mt-3">
            <Image
              fill
              data-testid="footer-bridge-logo"
              src="/header-logo.svg"
              alt="Bridge Logo"
            />
          </div>
        </div>
        <div className="pl-1 flex-row justify-between">
          <div className="font-semibold">Version {version}</div>
          <div>
            Quantum is a proud development of Birthday Research — the blockchain
            R&D arm of Cake DeFi.
          </div>
          <div className="flex flex-row justify-between pt-[19px] md:pt-[26px] lg:pt-0">
            <div className="flex flex-col md:flex-row md:items-end">
              <div className="pb-2 pr-[11px] md:pb-0  xs:pb-[12.5px]">
                &copy; {new Date().getFullYear()} Birthday Research
              </div>
              <Socials items={BirthdayResearchSocialItems} />
            </div>
            <div className="md:flex md:flex-row-reverse lg:flex-col lg:items-end lg:pt-0">
              <div className="pb-2 xs:pb-[12.5px] md:pl-2 md:pb-0 lg:relative lg:bottom-[20px]">
                &copy; DeFiChain
              </div>
              <Socials items={DeFiChainSocialItems} />
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
