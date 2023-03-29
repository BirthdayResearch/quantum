import { IoClose } from "react-icons/io5";

export default function AnnouncementBanner(): JSX.Element {
  // TODO: Get the announcement from walletkit api
  const announcement =
    "This is where you announce something within the product. You can say whatever you want but make sure it’s worth the announcement banner.";
  return (
    <div className="flex flex-row justify-between py-[18px] px-[120px] bg-dark-gradient-4">
      <span className="text-dark-00 text-sm">{announcement}</span>
      <IoClose size={20} className="cursor-pointer" />
    </div>
  );
}
