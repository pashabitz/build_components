import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

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
        return await ctx.db.insert("tasks", { url: args.url, isRoot: true });
    }
});
export const registerLinkTask = internalMutation({
    args: { url: v.string() },
    handler: async (ctx, args) => {
        if (!isUrlValid(args.url)) {
            throw new Error("Invalid URL");
        }
        const lastExistingPage = await ctx.db
            .query("pages")
            .filter(q => q.eq(q.field("url"), args.url))
            .order("desc")
            .first();

        if (lastExistingPage && lastExistingPage._creationTime && lastExistingPage._creationTime > Date.now() - 1000 * 60 * 60 * 24) {
            const date = new Date(lastExistingPage._creationTime);
            console.log(`Skipping task registration for ${args.url} - fetched last at ${date}}`);
            return;
        }
        return await ctx.db.insert("tasks", { url: args.url, isRoot: false });
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
            .filter(q => q.eq(q.field("isRoot"), true))
            .collect();
    }
});

export const getUnprocessed = internalQuery({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("tasks")
            .filter(q => q.eq(q.field("lastProcessed"), undefined))
            .first();
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
        const tasksWithUrl = await ctx.db
            .query("tasks")
            .filter(q => q.and(
                q.eq(q.field("url"), args.url),
                q.eq(q.field("lastProcessed"), undefined),
            ))
            .take(100);
        console.log(`Found ${tasksWithUrl.length} tasks with url ${args.url}`);
        for (const task of tasksWithUrl) {
            await ctx.db.patch(task._id, { lastProcessed: Date.now() });
        }
    }
});