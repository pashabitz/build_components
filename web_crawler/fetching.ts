import { v } from "convex/values";
import { functions } from "./_generated/api";
import {action, internalAction, internalMutation} from "./_generated/server";

export const periodicFetch = internalAction({
    args: {},
    handler: async (ctx) => {
        const tasks = await ctx.runQuery(functions.tasks.getUnprocessed, {});
        console.log(`Found ${tasks.length} tasks`);
        if (!tasks || tasks.length === 0) return;
        const task = tasks[0];
        const url = task.url;
        // fetch from url
        console.log(`Fetching ${url}`);
        const response = await fetch(url);
        console.log(`Response status ${response.status}`);
        const blob = await response.blob();
        // save to pages
        const storageId = await ctx.storage.store(blob)
        const pageId = await ctx.runMutation(functions.pages.insert, { url, bodyStorage: storageId });
        // await ctx.runMutation(functions.tasks.setProcessed, { id: task._id });
        await ctx.runMutation(functions.tasks.setProcessedByUrl, { url });
        await ctx.scheduler.runAfter(0, functions.fetching.createTasksFromLinks, { pageId });
    }
})

export const bar = action({
    args: {},
    handler: async () => {
        console.log("bar");
        return "bar";
    }
})

function getLinkUrl(url: string, root: string) {
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    return null;
}

export const createTasksFromLinks = internalAction({
    args: { pageId: v.id("pages") },
    handler: async (ctx, args) => {
        const page = await ctx.runQuery(functions.pages.get, { id: args.pageId });
        if (page === null || !page || !page.bodyStorage) return;
        const blob = await ctx.storage.get(page.bodyStorage);
        if (!blob) return;
        const body = await blob.text();
        // find all links using a regex
        const matches = body.match(/href="([^"]*)"/g);
        if (!matches) return;
        const links = matches.map(m => m.substring(6, m.length - 1));
        console.log(`Found ${links.length} links`);
        for (let i = 0; i < links.length; i++) {
            const taskUrl = getLinkUrl(links[i], page.url);
            if (!taskUrl) continue;
            console.log(`Registering link task ${taskUrl}`);
            try {
                await ctx.runMutation(functions.tasks.registerLinkTask, { url: taskUrl });
            }
            catch (e) {
                console.error(`Error registering link task ${taskUrl}: ${e}`);
            }
        }
        console.log(links);
    },
})
