# Crawler Component

## Install
```
// in convex/app.config.ts
const crawlerComponent = app.install(webCrawler, { name: "webCrawler", args: {} });
app.mount({ webCrawler: crawlerComponent.exports as any });
app.mountHttp("/crawler/", crawlerComponent);
```

## Use

### Register a crawler task
Use the mutation `tasks.registerTask` from your own convex function:
```
ctx.runMutation(api.webCrawler.tasks.registerTask, { url: "https://example.com" });
```

Or from your client:
```
const registerTask = useMutation(api.webCrawler.tasks.registerTask);
registerTask({ url: "https://example.com" });
```

### Get fetched page by URL
```
ctx.runQuery(api.webCrawler.pages.getByUrl, { url: "https://docs.convex.dev/home" });
```
Returns
```
{
    _id: Id<"pages">;
    _creationTime: number;
    bodyStorage?: Id<"_storage"> | undefined;
    url: string;
    domain: string;
} | null
```

### Get all fetched pages by domain
```
ctx.runQuery(api.webCrawler.pages.getByDomain, { domain: "example.com" });
```

Returns
```
Array<{
    _id: Id<"pages">;
    _creationTime: number;
    bodyStorage?: Id<"_storage"> | undefined;
    url: string;
    domain: string;
}>
```

### Get body of page
Using the id obtained from `getByDomains` above make a request to
```
YOUR_CONVEX_SITE_URL/crawler/page/ID
```