package com.manabandhu.backend.rides;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job to invoke the automated 2-hour chat purge function
 * for expired ride coordination conversations.
 */
@Component
public class RideChatPurgeScheduler {

    private static final Logger log = LoggerFactory.getLogger(RideChatPurgeScheduler.class);

    private final JdbcTemplate jdbcTemplate;

    public RideChatPurgeScheduler(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Runs every 10 minutes to clean up ride chats where chat_expires_at <= NOW().
     */
    @Scheduled(fixedDelay = 600000)
    public void purgeExpiredRideChats() {
        try {
            log.debug("Executing scheduled purge of expired ride chats...");
            jdbcTemplate.execute("SELECT public.purge_expired_ride_chats()");
            log.debug("Finished scheduled purge of expired ride chats.");
        } catch (Exception e) {
            log.warn("Failed to execute purge_expired_ride_chats: {}", e.getMessage());
        }
    }
}
