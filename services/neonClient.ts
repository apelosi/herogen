import { createClient } from "@neondatabase/neon-js";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

import { CONFIG } from "../config";

export const neonClient = createClient({
  auth: {
    adapter: BetterAuthReactAdapter(),
    url: CONFIG.NEON_AUTH_URL,
  },
  dataApi: {
    url: CONFIG.NEON_DATA_API_URL,
  },
});

