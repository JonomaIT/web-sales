import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import { isRouteErrorResponse, useRouteError } from "react-router";

// Last line of defense: a page that throws shows this instead of a blank screen.
export default function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error);

  return (
    <Box padding="xxl">
      <Alert
        type="error"
        header="Algo deu errado nesta página"
        action={<Button onClick={() => window.location.assign("/")}>Voltar ao início</Button>}
      >
        {detail}
      </Alert>
    </Box>
  );
}
