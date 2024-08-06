import { defineApp } from "convex/server";
import webCrawler from "../web_crawler/component.config";

const app = defineApp();
const crawlerComponent = app.install(webCrawler, { name: "webCrawler", args: {} });
app.mount({ webCrawler: crawlerComponent.exports });
export default app;