import clsx from "clsx";
import { FiBook } from "react-icons/fi";
import { RiQuestionFill } from "react-icons/ri";

export default function WelcomeHeader() {
  const headerStyle =
    "text-[32px] leading-10 xs:text-[36px] xs:w-6/12 md:w-full lg:leading-[52px] text-dark-1000 lg:text-[44px]";
  const bylineStyle =
    "align-middle text-base text-dark-1000 lg:leading-10 lg:text-[32px] text-xl";
  const underText = "ml-2 lg:text-xl md:text-sm font-bold text-dark-1000";
  return (
    <div>
      <h1 className={clsx(headerStyle)}>Building a</h1>
      <h1 className={clsx(headerStyle)}>decentralised</h1>
      <h1 className={clsx(headerStyle)}>tomorrow</h1>
      <div className="mt-2">
        <h2 className={clsx(bylineStyle)}>connecting one</h2>
        <h2 className={clsx(bylineStyle)}>blockchain at a time</h2>
        <div className="flex flex-row items-center xs:mt-[36px] md:mt-7">
          <button type="button" className="flex flex-row items-center">
            <FiBook size={20} className="text-dark-1000" />
            <span className={clsx(underText)}>User Guide</span>
          </button>
          <button type="button" className="ml-6 flex flex-row items-center">
            <RiQuestionFill size={20} className="text-dark-1000" />
            <span className={clsx(underText)}>FAQs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
