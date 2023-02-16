import { useRouter } from "next/router";
import { IconType } from "react-icons";
import { FiBook, FiHelpCircle } from "react-icons/fi";

interface MenuListItem {
  id: string;
  title: string;
  icon: IconType;
  onClick: () => void;
}

export default function MobileBottomMenu() {
  const router = useRouter();

  const menuList: MenuListItem[] = [
    {
      id: "faqs",
      title: "FAQs",
      icon: FiHelpCircle,
      onClick: () => router.push("/faq"),
    },
    {
      id: "guide",
      title: "User Guide",
      icon: FiBook,
      onClick: () => router.push("/user-guide"),
    },
  ];

  return (
    <nav>
      <ul className="grid grid-cols-2 gap-2">
        {menuList.map(({ icon: Icon, ...item }) => (
          <li key={item.title}>
            <button
              type="button"
              className="w-full flex flex-col items-center gap-2 cursor-pointer focus-visible:outline-none hover:opacity-70"
              onClick={item.onClick}
            >
              <Icon size={28} className="text-dark-900" />
              <span className="text-xs font-semibold text-dark-900">
                {item.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
