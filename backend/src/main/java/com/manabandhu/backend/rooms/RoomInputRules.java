package com.manabandhu.backend.rooms;

/** Allowed values for listing fields; anything else is a 400 instead of a database error. */
final class RoomInputRules {

    static final String DIET = "ANY|PURE_VEG|VEG_PREFERRED|VEG_FRIENDLY|NON_VEG_ALLOWED";
    static final String GENDER = "ANY|MALE_ONLY|FEMALE_ONLY";
    static final String BATHROOM = "SHARED|PRIVATE_DEDICATED|PRIVATE_ATTACHED";
    static final String LEASE = "FLEXIBLE|SHORT_TERM|LONG_TERM|SUBLEASE|MONTH_TO_MONTH|SIX_MONTHS|ONE_YEAR";
    static final String NOT_BLANK = "(?s).*\\S.*";

    private RoomInputRules() {
    }
}
