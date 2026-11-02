package com.manabandhu.backend.common;

/** Small string helpers shared by services. */
public final class Strings {

    private Strings() {}

    /** {@code null} for null or blank input, otherwise the trimmed value. */
    public static String blankToNull(String value) {
        if (value == null) return null;
        var trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
