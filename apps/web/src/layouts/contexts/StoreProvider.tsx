import initializeStore from "@store/index";
import { PropsWithChildren, useMemo } from "react";
import { Provider } from "react-redux";

export default function StoreProvider(
  props: PropsWithChildren<any>
): JSX.Element {
  const { children } = props;
  const store = useMemo(() => initializeStore(), []);

  return <Provider store={store}>{children}</Provider>;
}
