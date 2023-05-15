export default function GoToAnotherTransaction({
  onClick,
}: {
  onClick: () => void;
}): JSX.Element {
  return (
    <span className="text-xs text-dark-700 text-center">
      Have another transaction?{" "}
      <button onClick={onClick} className="text-dark-1000">
        Track it here
      </button>
    </span>
  );
}
