import { defineApp } from "convex/server";
import staticHosting from "@convex-dev/static-hosting/convex.config";

// App-owned root routing: convex/http.ts keeps its routes at the root
// (Convex Auth needs that later) and registers the static catch-all last.
const app = defineApp();
app.use(staticHosting);

export default app;
