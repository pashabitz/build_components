import { action, app } from "./_generated/server";

export const foo = action({
    handler: async (ctx) => {
        console.log("foo");
        await ctx.runAction(app.webCrawler.fetching.periodicFetch, {});
        await ctx.runAction(app.webCrawler.fetching.bar, {});
        return "foo";// gen2
    }
})