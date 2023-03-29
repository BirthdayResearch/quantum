import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiArrowUpRight } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { satisfies } from "semver";
import { RootState } from "@store/reducers/rootReducer";
import { selectVersion } from "@store/slices/versionSlice";
import { useLazyBridgeAnnouncements } from "@store/index";
import { AnnouncementData } from "types";

export default function AnnouncementBanner(): JSX.Element {
  const appVersion = useSelector((state: RootState) => selectVersion(state));
  const [trigger] = useLazyBridgeAnnouncements();
  const [announcement, setAnnouncement] = useState<{
    content: string;
    url?: string;
  }>();

  async function getAnnouncements() {
    const { data } = await trigger({});
    const announce: AnnouncementData = data.find(({ version }) =>
      satisfies(appVersion, version)
    );
    if (announce) {
      setAnnouncement({ content: announce.lang.en, url: announce.url });
    }
  }

  useEffect(() => {
    getAnnouncements();
  }, []);

  return announcement ? (
    <div className="flex flex-row justify-between items-center py-[18px] px-6 md:px-10 lg:px-[120px] bg-dark-gradient-4">
      <div className="flex items-center text-dark-00 text-xs lg:text-sm">
        <span>{announcement.content}</span>
        {announcement.url && (
          <FiArrowUpRight
            size={20}
            className="shrink-0 cursor-pointer ml-2"
            onClick={() => window.open(announcement.url, "_blank")}
          />
        )}
      </div>
      {/* TODO: Add close action */}
      <IoClose size={20} className="shrink-0 cursor-pointer ml-6" />
    </div>
  ) : null;
}
