import { v } from "convex/values";
import { httpAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";

export const insert = internalMutation({
    args: { url: v.string(), bodyStorage: v.id("_storage") },
    handler: async (ctx, args) => {
        const domain = new URL(args.url).hostname;
        return await ctx.db.insert("pages", { url: args.url, bodyStorage: args.bodyStorage, domain });
    }
});

export const get = internalQuery({
    args: { id: v.id("pages") },
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

export const postMessage = httpAction(async (ctx, request) => {
    const requestQueryString = new URL(request.url).searchParams;
    console.log(requestQueryString);    

  return new Response(null, {
    status: 200,
  });
});