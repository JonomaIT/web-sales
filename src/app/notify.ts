import type { FlashbarProps } from "@cloudscape-design/components/flashbar";
import { createContext, useContext } from "react";

// App-wide messages (Flashbar): any page calls notify(), the layout shows them on top.

export type Notice = Omit<FlashbarProps.MessageDefinition, "id" | "dismissible" | "onDismiss">;

export interface NotificationsValue {
  items: FlashbarProps.MessageDefinition[];
  notify: (notice: Notice) => void;
}

export const NotificationsContext = createContext<NotificationsValue>({ items: [], notify: () => {} });

export function useNotify() {
  return useContext(NotificationsContext).notify;
}
