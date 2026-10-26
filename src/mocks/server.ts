import { setupServer } from "msw/node";
import { createHandlers } from "./handlers";

export const TEST_API_URL = "https://api.test";

export const server = setupServer(...createHandlers(TEST_API_URL));
