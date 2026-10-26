import { I18nProvider } from "@cloudscape-design/components/i18n";
import messages from "@cloudscape-design/components/i18n/messages/all.pt-BR";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { NotificationsProvider } from "./notifications";

export function Providers({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale="pt-BR" messages={[messages]}>
        <NotificationsProvider>{children}</NotificationsProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
