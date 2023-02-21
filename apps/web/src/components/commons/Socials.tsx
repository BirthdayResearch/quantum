import { IconType } from "react-icons";

interface SocialsProps {
  items: { icon: IconType; testId: string; label: string; href: string }[];
}

export default function Socials(props: SocialsProps): JSX.Element {
  const { items } = props;
  return (
    <div className="flex flex-row space-x-3.5">
      {items.map(({ href, testId, icon: Icon }) => (
        <a
          href={href}
          key={testId}
          target="_blank"
          rel="noreferrer"
          className=""
          data-testid={`${testId}`}
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
}
