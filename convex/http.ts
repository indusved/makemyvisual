import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Exact app routes first; the static catch-all must stay last.
auth.addHttpRoutes(http);
registerStaticRoutes(http, components.staticHosting);

export default http;
