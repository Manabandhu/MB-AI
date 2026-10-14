package com.manabandhu.backend.chat;

import jakarta.validation.constraints.Pattern;

/**
 * Optional body of {@code POST /api/v1/chat/conversations/{id}/read}. With {@code messageId} the read marker moves up to
 * that message's time; without it, up to now. The marker never moves backwards.
 */
public record MarkReadInput(
        @Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
                message = "messageId must be a UUID")
        String messageId) {}
