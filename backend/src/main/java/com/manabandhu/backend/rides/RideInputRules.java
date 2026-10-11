package com.manabandhu.backend.rides;

/** Allowed values for ride offer fields; anything else is a 400 instead of a database error. */
final class RideInputRules {

    static final String TOLLS = "AVOID_TOLLS|TOLLS_INCLUDED|TOLLS_SPLIT";
    static final String RECURRENCE = "ONE_TIME|WEEKDAYS|DAILY|WEEKLY|CUSTOM";
    static final String LUGGAGE = "BACKPACK_ONLY|MEDIUM|LARGE_SUITCASE";
    static final String GENDER = "ANY|FEMALE_ONLY|MALE_ONLY";
    static final String DAY = "MON|TUE|WED|THU|FRI|SAT|SUN";
    static final String NOT_BLANK = "(?s).*\\S.*";
    static final int MAX_SEATS = 8;

    private RideInputRules() {
    }
}
