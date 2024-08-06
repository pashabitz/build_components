import { defineApp } from "convex/server";
import webCrawler from "../web_crawler/component.config";

const app = defineApp();
const crawlerComponent = app.install(webCrawler, { name: "webCrawler", args: {} });
app.mount({ webCrawler: crawlerComponent.exports as any });
app.mountHttp("/crawler/", crawlerComponent);
export default app;