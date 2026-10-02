import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";

const http = httpRouter();

// Exact app routes (e.g. auth.addHttpRoutes(http)) go above this line.
registerStaticRoutes(http, components.staticHosting);

export default http;
