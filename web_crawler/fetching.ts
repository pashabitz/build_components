import { v } from "convex/values";
import { functions } from "./_generated/api";
import {action, internalAction, internalMutation} from "./_generated/server";

const shouldSkipUrl = (url: string) => {
    const lowercaseUrl = url.toLowerCase();
    const blacklistExtensions = ["css", "svg", "png", "ico"];
    const lastDot = lowercaseUrl.lastIndexOf(".");
    if (lastDot > -1) {
        const extension = lowercaseUrl.substring(lastDot + 1);
        if (blacklistExtensions.includes(extension)) return true;
    }
    return false;
}

export const periodicFetch = internalAction({
    args: {},
    handler: async (ctx) => {
        const task = await ctx.runQuery(functions.tasks.getUnprocessed, {});
        if (!task) return;
        const url = task.url;
        // fetch from url
        if (!shouldSkipUrl(url)) {
            console.log(`Fetching ${url}`);
            const response = await fetch(url);
            console.log(`Response status ${response.status}`);
            const blob = await response.blob();
            // save to pages
            const storageId = await ctx.storage.store(blob)
            const pageId = await ctx.runMutation(functions.pages.insert, { url, bodyStorage: storageId });
            await ctx.scheduler.runAfter(0, functions.fetching.createTasksFromLinks, { pageId });
        } else {
            console.log(`Skipping ${url}`);
        }
        await ctx.scheduler.runAfter(1000, functions.tasks.setProcessedByUrl, { url });
        await ctx.scheduler.runAfter(2000, functions.pages.setDomainLastFetched, { domain: new URL(url).hostname });
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
    if (shouldSkipUrl(url)) return null;
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
