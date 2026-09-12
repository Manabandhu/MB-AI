package com.manabandhu.backend.auth;

public record IdentityResponse(String id, String email, String fullName, String role) {
}
