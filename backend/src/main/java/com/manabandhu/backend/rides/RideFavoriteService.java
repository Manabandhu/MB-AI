package com.manabandhu.backend.rides;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Ride bookmarks ("saved rides"), stored in {@code ride_favorites}. */
@Service
public class RideFavoriteService {

    private final JdbcTemplate jdbcTemplate;
    private final RideAccess access;
    private final RideOfferRepository offerRepository;
    private final RideParticipantRepository participantRepository;

    RideFavoriteService(JdbcTemplate jdbcTemplate, RideAccess access, RideOfferRepository offerRepository,
                        RideParticipantRepository participantRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.access = access;
        this.offerRepository = offerRepository;
        this.participantRepository = participantRepository;
    }

    @Transactional
    public RideOffer save(UUID userId, UUID rideId) {
        var offer = access.requireOffer(rideId);
        jdbcTemplate.update("""
                INSERT INTO public.ride_favorites (ride_id, user_id) VALUES (?, ?)
                ON CONFLICT (ride_id, user_id) DO NOTHING
                """, rideId, userId);
        return offer;
    }

    @Transactional
    public void unsave(UUID userId, UUID rideId) {
        jdbcTemplate.update("DELETE FROM public.ride_favorites WHERE ride_id = ? AND user_id = ?", rideId, userId);
    }

    /** Bookmarked rides first (newest bookmark first), then rides the user has joined. */
    @Transactional(readOnly = true)
    public List<RideOffer> savedRides(UUID userId) {
        var ids = new LinkedHashSet<UUID>(jdbcTemplate.queryForList(
                "SELECT ride_id FROM public.ride_favorites WHERE user_id = ? ORDER BY created_at DESC", UUID.class, userId));
        participantRepository.findByUserIdOrderByJoinedAtDesc(userId).forEach(p -> ids.add(p.getRideId()));
        if (ids.isEmpty()) return List.of();
        var byId = offerRepository.findAllById(ids).stream()
                .collect(java.util.stream.Collectors.toMap(RideOffer::getId, o -> o));
        return ids.stream().map(byId::get).filter(java.util.Objects::nonNull).toList();
    }
}
