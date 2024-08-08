import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getDomain } from "./pages";
import { PaginationOptions, paginationOptsValidator } from "convex/server";
import { functions } from "./_generated/api";

function isUrlValid(str: string) {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', // fragment locator
      'i'
    );
    return pattern.test(str);
};


export const registerTask = mutation({
    args: { url: v.string() },
    handler: async (ctx, args) => {
        // check whether url is valid
        if (!isUrlValid(args.url)) {
            throw new Error("Invalid URL");
        }
        return await ctx.db.insert("tasks", { url: args.url, isRoot: true, domain: getDomain(args.url) });
    }
});
export const registerLinkTask = internalMutation({
    args: { url: v.string() },
    handler: async (ctx, args) => {
        if (!isUrlValid(args.url)) {
            console.log(`Skipping registering task for invalid url ${args.url}`);
            return;
        }
        const lastExistingPage = await ctx.db
            .query("pages")
            .withIndex("by_url", q => q.eq("url", args.url))
            .order("desc")
            .first();

        if (lastExistingPage && lastExistingPage._creationTime && lastExistingPage._creationTime > Date.now() - 1000 * 60 * 60 * 24) {
            const date = new Date(lastExistingPage._creationTime);
            console.log(`Skipping task registration for ${args.url} - fetched last at ${date}}`);
            return;
        }
        return await ctx.db.insert("tasks", { url: args.url, isRoot: false, domain: getDomain(args.url) });
    }
});

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("tasks").collect();
    }
});

export const getRoot = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("tasks")
            .withIndex("by_isRoot", q => q.eq("isRoot", true))
            .order("desc")
            .take(20);
    }
});

export const getUnprocessed = internalQuery({
    args: { domainsToSkip: v.union(v.array(v.string()), v.null()) },
    handler: async (ctx, args) => {
        const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_lastProcessed", q => q.eq("lastProcessed", undefined))
        .order("asc")
        .take(100);
        const filtered = tasks.filter(t => !args.domainsToSkip || !t.domain || !args.domainsToSkip.includes(t.domain));
        return filtered.length > 0 ? filtered[0] : null;
    }
});

export const setProcessed = internalMutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { lastProcessed: Date.now() });
    }
});

export const setProcessedByUrl = internalMutation({
    args: { url: v.string() },
    handler: async (ctx, args) => {
        let tasksWithUrl = await ctx.db
            .query("tasks")
            .withIndex("by_url", q => q.eq("url", args.url))
            .take(1000);
        tasksWithUrl = tasksWithUrl.filter(t => !t.lastProcessed);
        console.log(`Found ${tasksWithUrl.length} unprocessed tasks with url ${args.url}`);
        for (const task of tasksWithUrl.slice(0, 100)) {
            await ctx.db.patch(task._id, { lastProcessed: Date.now() });
        }
    }
});

export const getPageOfTasks = internalQuery({
    args: { laterThan: v.number() },
    handler: async (ctx, args) => {
        let laterThan = args.laterThan;
            console.log(`Fetching tasks created after ${new Date(laterThan)}`);
        return await ctx.db
            .query("tasks")
            .filter(q => q.gt(q.field("_creationTime"), laterThan))
            .order("asc")
            .take(1000);
    }
})

export const setTaskDomain = internalMutation({
    args: { task: v.object({ _id: v.id("tasks"), url: v.string() }) },
    handler: async (ctx, args) => {
       return await ctx.db.patch(args.task._id, { domain: getDomain(args.task.url) });
    }
})

export const addDomainToTasks = internalAction({
    args: {},
    handler: async (ctx) => {
        let laterThan = Date.now() - 1000 * 60 * 60 * 48;
        while (true) {
            const tasks = await ctx.runQuery(functions.tasks.getPageOfTasks, { laterThan });
            if (!tasks || tasks.length === 0) {
                break;
            }
            console.log(`Processing ${tasks.length} tasks`);
            for (const t of tasks) {
                await ctx.runMutation(functions.tasks.setTaskDomain, { task: { _id: t._id, url: t.url} });
            }
            laterThan = tasks[tasks.length - 1]._creationTime;
        }
    }
})