import Flashbar, { type FlashbarProps } from "@cloudscape-design/components/flashbar";
import { useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { NotificationsContext, type Notice } from "./notify";

let nextId = 0;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FlashbarProps.MessageDefinition[]>([]);

  const notify = useCallback((notice: Notice) => {
    const id = `notice-${++nextId}`;
    const dismiss = () => setItems((current) => current.filter((item) => item.id !== id));
    setItems((current) =>
      [{ ...notice, id, dismissible: true, dismissLabel: "Fechar", onDismiss: dismiss }, ...current].slice(
        0,
        3,
      ),
    );
  }, []);

  const value = useMemo(() => ({ items, notify }), [items, notify]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function Notifications() {
  const { items } = useContext(NotificationsContext);
  return <Flashbar items={items} stackItems={items.length > 2} />;
}
