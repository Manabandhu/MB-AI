package com.manabandhu.backend.foundation;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class OnboardingService {

    private static final Logger log = LoggerFactory.getLogger(OnboardingService.class);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public OnboardingService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional(readOnly = true)
    public OnboardingConfigResponse getConfig() {
        String stepsSql = "SELECT step_key, step_order, title, subtitle, is_multi_select, is_required " +
                "FROM public.onboarding_steps ORDER BY step_order ASC";

        List<StepRow> stepRows = jdbcTemplate.query(stepsSql, (rs, rowNum) -> new StepRow(
                rs.getString("step_key"),
                rs.getInt("step_order"),
                rs.getString("title"),
                rs.getString("subtitle"),
                rs.getBoolean("is_multi_select"),
                rs.getBoolean("is_required")
        ));

        String optionsSql = "SELECT id, step_key, option_key, label, description, icon_name, category, sort_order, metadata " +
                "FROM public.onboarding_options WHERE is_active = true ORDER BY step_key, sort_order ASC";

        Map<String, List<OnboardingOptionDto>> optionsByStep = new HashMap<>();
        jdbcTemplate.query(optionsSql, rs -> {
            String stepKey = rs.getString("step_key");
            UUID id = (UUID) rs.getObject("id");
            String optionKey = rs.getString("option_key");
            String label = rs.getString("label");
            String description = rs.getString("description");
            String iconName = rs.getString("icon_name");
            String category = rs.getString("category");
            int sortOrder = rs.getInt("sort_order");
            Map<String, Object> metadata = parseJson(rs.getString("metadata"));

            var optionDto = new OnboardingOptionDto(id, stepKey, optionKey, label, description, iconName, category, sortOrder, metadata);
            optionsByStep.computeIfAbsent(stepKey, k -> new ArrayList<>()).add(optionDto);
        });

        List<OnboardingStepDto> steps = stepRows.stream().map(step -> new OnboardingStepDto(
                step.stepKey(),
                step.stepOrder(),
                step.title(),
                step.subtitle(),
                step.isMultiSelect(),
                step.isRequired(),
                optionsByStep.getOrDefault(step.stepKey(), List.of())
        )).toList();

        return new OnboardingConfigResponse(steps);
    }

    @Transactional
    public UserOnboardingProgressDto getProgress(UUID userId) {
        String selectSql = "SELECT user_id, current_step, is_completed, selected_reasons, metro_location, zip_code, " +
                "university_campus, primary_language, secondary_languages, interest_tags, avatar_url, bio, " +
                "notification_preferences, safety_pledge_accepted, completed_at, updated_at " +
                "FROM public.user_onboarding_progress WHERE user_id = ?";

        List<UserOnboardingProgressDto> list = jdbcTemplate.query(selectSql, (rs, rowNum) -> mapProgressRow(rs), userId);

        if (!list.isEmpty()) {
            return list.get(0);
        }

        // Initialize progress row for new user
        String insertSql = "INSERT INTO public.user_onboarding_progress (user_id, current_step, is_completed) " +
                "VALUES (?, 'goals', false) " +
                "ON CONFLICT (user_id) DO NOTHING";
        jdbcTemplate.update(insertSql, userId);

        return new UserOnboardingProgressDto(
                userId,
                "goals",
                false,
                List.of(),
                null,
                null,
                null,
                null,
                List.of(),
                List.of(),
                null,
                null,
                Map.of(),
                false,
                null,
                Instant.now()
        );
    }

    @Transactional
    public UserOnboardingProgressDto saveStep(UUID userId, String rawStepKey, Map<String, Object> payload) {
        if (payload == null) {
            payload = Map.of();
        }

        // Normalize step key
        String stepKey = normalizeStepKey(rawStepKey);

        // Ensure row exists
        getProgress(userId);

        // Build dynamic update
        List<String> setClauses = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        setClauses.add("current_step = ?");
        params.add(stepKey);

        if ("goals".equals(stepKey) || payload.containsKey("selectedReasons") || payload.containsKey("reasons")) {
            List<String> reasons = extractStringList(payload, "selectedReasons", "reasons");
            if (reasons != null) {
                setClauses.add("selected_reasons = ?::text[]");
                params.add(toPgArray(reasons));
            }
        }

        if ("location".equals(stepKey) || payload.containsKey("metroLocation")) {
            if (payload.containsKey("metroLocation")) {
                setClauses.add("metro_location = ?");
                params.add(payload.get("metroLocation"));
            }
            if (payload.containsKey("zipCode")) {
                setClauses.add("zip_code = ?");
                params.add(payload.get("zipCode"));
            }
            if (payload.containsKey("universityCampus")) {
                setClauses.add("university_campus = ?");
                params.add(payload.get("universityCampus"));
            }
        }

        if ("languages".equals(stepKey) || payload.containsKey("primaryLanguage") || payload.containsKey("secondaryLanguages")) {
            if (payload.containsKey("primaryLanguage")) {
                setClauses.add("primary_language = ?");
                params.add(payload.get("primaryLanguage"));
            }
            List<String> sec = extractStringList(payload, "secondaryLanguages", "languages");
            if (sec != null) {
                setClauses.add("secondary_languages = ?::text[]");
                params.add(toPgArray(sec));
            }
        }

        if ("interests".equals(stepKey) || payload.containsKey("interestTags") || payload.containsKey("interests")) {
            List<String> interests = extractStringList(payload, "interestTags", "interests");
            if (interests != null) {
                setClauses.add("interest_tags = ?::text[]");
                params.add(toPgArray(interests));
            }
        }

        if ("profile-photo".equals(stepKey) || "profile_photo".equals(stepKey) || payload.containsKey("avatarUrl") || payload.containsKey("bio")) {
            if (payload.containsKey("avatarUrl")) {
                setClauses.add("avatar_url = ?");
                params.add(payload.get("avatarUrl"));
            }
            if (payload.containsKey("bio")) {
                setClauses.add("bio = ?");
                params.add(payload.get("bio"));
            }
        }

        if ("notifications".equals(stepKey) || payload.containsKey("notificationPreferences")) {
            Object prefs = payload.get("notificationPreferences");
            if (prefs != null) {
                setClauses.add("notification_preferences = ?::jsonb");
                params.add(toJson(prefs));
            }
        }

        if ("trust_safety".equals(stepKey) || "trust-and-safety".equals(stepKey) || payload.containsKey("safetyPledgeAccepted")) {
            if (payload.containsKey("safetyPledgeAccepted")) {
                setClauses.add("safety_pledge_accepted = ?");
                params.add(Boolean.TRUE.equals(payload.get("safetyPledgeAccepted")));
            }
        }

        setClauses.add("updated_at = NOW()");

        String updateSql = "UPDATE public.user_onboarding_progress SET " + String.join(", ", setClauses) + " WHERE user_id = ?";
        params.add(userId);

        jdbcTemplate.update(updateSql, params.toArray());

        return getProgress(userId);
    }

    @Transactional
    public UserOnboardingProgressDto completeOnboarding(UUID userId) {
        String sql = "UPDATE public.user_onboarding_progress SET " +
                "is_completed = true, " +
                "current_step = 'complete', " +
                "completed_at = NOW(), " +
                "updated_at = NOW() " +
                "WHERE user_id = ?";

        jdbcTemplate.update(sql, userId);
        log.info("Onboarding completed successfully for user {}", userId);

        return getProgress(userId);
    }

    private String normalizeStepKey(String raw) {
        if (raw == null) return "goals";
        return switch (raw) {
            case "what-brings-you-here", "reason" -> "goals";
            case "profile_photo" -> "profile-photo";
            case "trust-and-safety" -> "trust_safety";
            default -> raw;
        };
    }

    private UserOnboardingProgressDto mapProgressRow(ResultSet rs) throws SQLException {
        UUID userId = (UUID) rs.getObject("user_id");
        String currentStep = rs.getString("current_step");
        boolean isCompleted = rs.getBoolean("is_completed");

        List<String> selectedReasons = readSqlArray(rs.getArray("selected_reasons"));
        String metroLocation = rs.getString("metro_location");
        String zipCode = rs.getString("zip_code");
        String universityCampus = rs.getString("university_campus");
        String primaryLanguage = rs.getString("primary_language");
        List<String> secondaryLanguages = readSqlArray(rs.getArray("secondary_languages"));
        List<String> interestTags = readSqlArray(rs.getArray("interest_tags"));
        String avatarUrl = rs.getString("avatar_url");
        String bio = rs.getString("bio");
        Map<String, Object> notificationPreferences = parseJson(rs.getString("notification_preferences"));
        boolean safetyPledgeAccepted = rs.getBoolean("safety_pledge_accepted");

        Timestamp completedAtTs = rs.getTimestamp("completed_at");
        Instant completedAt = completedAtTs != null ? completedAtTs.toInstant() : null;

        Timestamp updatedAtTs = rs.getTimestamp("updated_at");
        Instant updatedAt = updatedAtTs != null ? updatedAtTs.toInstant() : Instant.now();

        return new UserOnboardingProgressDto(
                userId,
                currentStep,
                isCompleted,
                selectedReasons,
                metroLocation,
                zipCode,
                universityCampus,
                primaryLanguage,
                secondaryLanguages,
                interestTags,
                avatarUrl,
                bio,
                notificationPreferences,
                safetyPledgeAccepted,
                completedAt,
                updatedAt
        );
    }

    private List<String> readSqlArray(Array sqlArray) throws SQLException {
        if (sqlArray == null) {
            return List.of();
        }
        Object array = sqlArray.getArray();
        if (array instanceof String[] strings) {
            return Arrays.asList(strings);
        }
        if (array instanceof Object[] objects) {
            return Arrays.stream(objects).map(String::valueOf).toList();
        }
        return List.of();
    }

    private static String toPgArray(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "{}";
        }
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            String s = list.get(i).replace("\"", "\\\"");
            sb.append("\"").append(s).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private List<String> extractStringList(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key)) {
                Object val = map.get(key);
                if (val instanceof List<?> rawList) {
                    return rawList.stream().map(String::valueOf).toList();
                }
            }
        }
        return null;
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    private record StepRow(
            String stepKey,
            int stepOrder,
            String title,
            String subtitle,
            boolean isMultiSelect,
            boolean isRequired
    ) {}
}
