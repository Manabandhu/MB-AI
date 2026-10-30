package com.manabandhu.backend.post;

/** How many people gave a post one reaction type. Public, so it carries no user ids. */
public record ReactionCount(String type, long count) {}
