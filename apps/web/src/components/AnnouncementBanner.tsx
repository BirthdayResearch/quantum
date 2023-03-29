import { useEffect, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { satisfies } from "semver";
import { useLazyBridgeAnnouncements } from "store";
import { AnnouncementData } from "types";

export default function AnnouncementBanner(): JSX.Element {
  const [trigger] = useLazyBridgeAnnouncements();
  const [announcement, setAnnouncement] = useState<{
    content: string;
    url?: string;
  }>();

  async function getAnnouncements() {
    const { data } = await trigger({});
    const announce: AnnouncementData = data.find(({ version }) =>
      // TODO: Get the proper app version
      satisfies("1.6.1", version)
    );
    if (announce) {
      setAnnouncement({ content: announce.lang.en, url: announce.url });
    }
  }

  useEffect(() => {
    getAnnouncements();
  }, []);

  return announcement ? (
    // TODO: Handle ipad and mobile view
    <div className="flex flex-row justify-between py-[18px] px-[120px] bg-dark-gradient-4">
      <div className="flex text-dark-00 text-sm">
        <span>{announcement.content}</span>
        {announcement.url && (
          <FiArrowUpRight
            size={20}
            className="cursor-pointer ml-2"
            onClick={() => window.open(announcement.url, "_blank")}
          />
        )}
      </div>
      {/* TODO: Add close action */}
      <IoClose size={20} className="cursor-pointer" />
    </div>
  ) : null;
}
