import IconTooltip from "./commons/IconTooltip";
import { CONSORTIUM_INFO } from "../constants";

export default function WelcomeHeader() {
  return (
    <div>
      <h1 className="text-[32px] leading-[44px] text-dark-1000 lg:text-[44px] lg:leading-[60px]">
        Welcome to
      </h1>
      <h1 className="text-[32px] leading-[44px] text-dark-1000 lg:text-[44px] lg:leading-[60px]">
        DeFiChain Bridge
      </h1>
      <div className="mt-2">
        <span className="align-middle text-base text-dark-700 lg:text-xl">
          A secure and easy way to transfer tokens wrapped by DeFiChain
          Consortium
        </span>
        <button type="button" className="ml-1 align-middle">
          <IconTooltip
            title={CONSORTIUM_INFO.title}
            content={CONSORTIUM_INFO.content}
          />
        </button>
      </div>
    </div>
  );
}
