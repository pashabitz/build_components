import { httpRouter } from "convex/server";
import { functions } from "./_generated/api";
import { getBody } from "./pages";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
    pathPrefix: "/page/",
    method: "GET",
    handler: getBody,
});

export default http;