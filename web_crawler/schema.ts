import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    tasks: defineTable({
        url: v.string(),
        isRoot: v.boolean(),
        lastProcessed: v.optional(v.number()),
        domain: v.optional(v.string()),
    })
    .index("by_isRoot", ["isRoot"])
    .index("by_domain", ["domain"])
    .index("by_url", ["url"])
    .index("by_lastProcessed", ["lastProcessed"]),
    pages: defineTable({
        url: v.string(),
        bodyStorage: v.optional(v.id("_storage")),
        domain: v.string(),
    })
    .index("by_domain", ["domain"])
    .index("by_url", ["url"]),
    domains: defineTable({
        domain: v.string(),
        lastFetched: v.number(),
    })
    .index("by_domain", ["domain"])
    .index("by_lastFetched", ["lastFetched"]),
});