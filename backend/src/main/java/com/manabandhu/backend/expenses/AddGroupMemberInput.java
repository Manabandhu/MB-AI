package com.manabandhu.backend.expenses;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AddGroupMemberInput(@NotNull UUID userId) {}
