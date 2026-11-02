package com.manabandhu.backend.community;

/** How many people gave a post one reaction type. Public, so it carries no user ids. */
public record ReactionCount(String type, long count) {}
