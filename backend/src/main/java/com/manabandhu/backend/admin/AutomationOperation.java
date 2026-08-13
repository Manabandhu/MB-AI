package com.manabandhu.backend.admin;

public record AutomationOperation(
        String id,
        String label,
        String description,
        String category,
        String risk,
        boolean requiresConfirmation,
        boolean configured) {}
