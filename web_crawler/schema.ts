import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    tasks: defineTable({
        url: v.string(),
        isRoot: v.boolean(),
        lastProcessed: v.optional(v.number()),
    }),
    pages: defineTable({
        url: v.string(),
        bodyStorage: v.optional(v.id("_storage")),
        domain: v.string(),
    })
    .index("by_domain", ["domain"]),
});