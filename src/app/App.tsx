import AppLayout from "@cloudscape-design/components/app-layout";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import Spinner from "@cloudscape-design/components/spinner";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { Mode } from "@cloudscape-design/global-styles";
import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useMatches, type Params } from "react-router";
import { useApiInfo } from "../features/sales/hooks";
import { getConfig } from "./config";
import { useFollow } from "./navigation";
import { Notifications } from "./notifications";
import { useNotify } from "./notify";
import { initialMode, saveMode } from "./theme";

export interface RouteHandle {
  crumb?: string | ((params: Params) => string);
}

const STATE_LABEL = { ACTIVE: "ativa", PASSIVE: "passiva", UNKNOWN: "estado desconhecido" } as const;

/** Tells the person when another region starts answering: a failover happened (ADR-012). */
function useFailoverNotice() {
  const info = useApiInfo();
  const notify = useNotify();
  const lastRegion = useRef<string | undefined>(undefined);
  const region = info.data?.region;
  const state = info.data?.region_state;

  useEffect(() => {
    if (!region || !state) return;
    if (lastRegion.current && lastRegion.current !== region) {
      notify({
        type: "warning",
        header: `A região que atende mudou: ${lastRegion.current} → ${region}`,
        content: `${region} está ${STATE_LABEL[state]}. As vendas pendentes seguem na fila e são processadas pela região ativa.`,
      });
    }
    lastRegion.current = region;
  }, [region, state, notify]);

  return info;
}

export default function App() {
  const follow = useFollow();
  const location = useLocation();
  const matches = useMatches();
  const info = useFailoverNotice();
  const [mode, setMode] = useState(initialMode);

  useEffect(() => saveMode(mode), [mode]);

  const crumbs = matches.flatMap((match) => {
    const crumb = (match.handle as RouteHandle | undefined)?.crumb;
    if (!crumb) return [];
    return [{ text: typeof crumb === "function" ? crumb(match.params) : crumb, href: match.pathname }];
  });

  const region = info.data
    ? {
        text: `${info.data.region} · ${STATE_LABEL[info.data.region_state]}`,
        ok: info.data.region_state === "ACTIVE",
      }
    : { text: info.isError ? "API indisponível" : "Consultando a API", ok: false };

  return (
    <>
      <div id="top-nav" style={{ position: "sticky", top: 0, zIndex: 1002 }}>
        <TopNavigation
          // No logo: with one, Cloudscape lets the title shrink to nothing next to the utilities.
          identity={{ href: "/", title: "JonomaIT Vendas", onFollow: follow }}
          utilities={[
            {
              type: "button",
              text: region.text,
              iconName: region.ok ? "status-positive" : "status-pending",
              ariaLabel: `Região que atende: ${region.text}`,
            },
            {
              type: "button",
              text: mode === Mode.Dark ? "Tema claro" : "Tema escuro",
              onClick: () => setMode(mode === Mode.Dark ? Mode.Light : Mode.Dark),
            },
          ]}
        />
      </div>
      <AppLayout
        headerSelector="#top-nav"
        toolsHide
        navigation={
          <SideNavigation
            header={{ href: "/", text: "Simulador de vendas" }}
            activeHref={location.pathname.startsWith("/vendas") ? "/vendas" : "/"}
            onFollow={follow}
            items={[
              { type: "link", text: "Visão geral", href: "/" },
              { type: "link", text: "Vendas", href: "/vendas" },
              { type: "divider" },
              { type: "link", text: "Estado da API", href: `${getConfig().apiUrl}/info`, external: true },
              {
                type: "link",
                text: "Código no GitHub",
                href: "https://github.com/JonomaIT/web-sales",
                external: true,
              },
            ]}
          />
        }
        notifications={<Notifications />}
        breadcrumbs={<BreadcrumbGroup items={crumbs} onFollow={follow} ariaLabel="Navegação estrutural" />}
        content={
          <Suspense fallback={<Spinner size="large" />}>
            <Outlet />
          </Suspense>
        }
      />
    </>
  );
}
