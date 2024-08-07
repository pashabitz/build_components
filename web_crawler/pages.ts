import { v } from "convex/values";
import { httpAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { functions } from "./_generated/api";

export const insert = internalMutation({
    args: { url: v.string(), bodyStorage: v.id("_storage") },
    handler: async (ctx, args) => {
        const domain = new URL(args.url).hostname;
        return await ctx.db.insert("pages", { url: args.url, bodyStorage: args.bodyStorage, domain });
    }
});

export const get = internalQuery({
    args: { id: v.union(v.id("pages"), v.string()) },
    handler: async (ctx, args) => {
        return await ctx.db.query("pages")
        .filter(q => q.eq(q.field("_id"), args.id))
        .unique();
    },
})

export const getByDomain = query({
    args: { domain: v.string() },
    handler: async (ctx, args) => {
        const query = 
        (!args.domain) ?
            ctx.db.query("pages")
        :
            ctx.db.query("pages")
            .filter(q => q.eq(q.field("domain"), args.domain))
        ;
        return await query.order("desc").take(10);
    }
})

export const getByUrl = query({
    args: { url: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.query("pages")
            .filter(q => q.eq(q.field("url"), args.url))
            .order("desc")
            .first();
    }
})

export const getBody = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const lastSlash = url.pathname.lastIndexOf("/");
    const notFound = new Response(null, {
        status: 404,
    });
    if (lastSlash === -1) {
        return notFound;      
    }
    const pageId = url.pathname.substring(lastSlash + 1);
    console.log(pageId);

    const page = await ctx.runQuery(functions.pages.get, { id: pageId });
    if (!page || !page.bodyStorage) {
        return notFound;
    }
    const blob = await ctx.storage.get(page.bodyStorage);
    if (!blob) {
        return notFound;
    }


  return new Response(blob, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
});