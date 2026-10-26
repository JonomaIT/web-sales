import "@cloudscape-design/global-styles/index.css";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { loadConfig } from "./app/config";
import { Providers } from "./app/providers";
import { createQueryClient } from "./app/queryClient";
import { routes } from "./app/router";

async function start() {
  const root = createRoot(document.getElementById("root")!);
  try {
    const config = await loadConfig();
    // `npm run dev`: the API is simulated in the browser. Dead code in a production build.
    if (import.meta.env.VITE_API_MOCK === "true") {
      const { startMockApi } = await import("./mocks/browser");
      await startMockApi(config.apiUrl);
    }
  } catch (err) {
    root.render(
      <Box padding="xxl">
        <Alert type="error" header="Não foi possível iniciar o site">
          {err instanceof Error ? err.message : String(err)}
        </Alert>
      </Box>,
    );
    return;
  }

  root.render(
    <StrictMode>
      <Providers queryClient={createQueryClient()}>
        <RouterProvider router={createBrowserRouter(routes)} />
      </Providers>
    </StrictMode>,
  );
}

void start();
