import { HiLockClosed } from "react-icons/hi";

export default function Banner(): JSX.Element {
  return (
    <div className="flex flex-row items-center py-[18px] text-dark-1000 bg-gradient-to-r from-[#00000066] to-[#00000000] px-6 lg:px-[120px] md:px-10 text-xs md:text-sm">
      <div className="h-4 w-4 min-w-4">
        <HiLockClosed size={16} />
      </div>
      <div className="pl-4">
        {`Quantum Bridge will enter maintenance mode indefinitely, please visit
        Birthday Research's Official Twitter account for the full information`}
      </div>
    </div>
  );
}
