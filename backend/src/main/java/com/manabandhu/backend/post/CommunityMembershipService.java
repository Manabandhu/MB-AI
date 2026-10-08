package com.manabandhu.backend.post;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Join and leave communities; {@code member_count} moves only when membership actually changes. */
@Service
public class CommunityMembershipService {

    private final JdbcTemplate jdbcTemplate;
    private final CommunityRepository communityRepository;

    CommunityMembershipService(JdbcTemplate jdbcTemplate, CommunityRepository communityRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.communityRepository = communityRepository;
    }

    @Transactional(readOnly = true)
    public Set<UUID> joinedCommunityIds(UUID userId) {
        return new HashSet<>(jdbcTemplate.queryForList(
                "SELECT community_id FROM public.community_members WHERE user_id = ?", UUID.class, userId));
    }

    @Transactional
    public void join(UUID communityId, UUID userId) {
        requireCommunity(communityId);
        var inserted = jdbcTemplate.update("""
                INSERT INTO public.community_members (community_id, user_id) VALUES (?, ?)
                ON CONFLICT (community_id, user_id) DO NOTHING
                """, communityId, userId);
        if (inserted > 0) {
            jdbcTemplate.update("UPDATE public.communities SET member_count = COALESCE(member_count, 0) + 1 WHERE id = ?",
                    communityId);
        }
    }

    @Transactional
    public void leave(UUID communityId, UUID userId) {
        requireCommunity(communityId);
        var deleted = jdbcTemplate.update(
                "DELETE FROM public.community_members WHERE community_id = ? AND user_id = ?", communityId, userId);
        if (deleted > 0) {
            jdbcTemplate.update(
                    "UPDATE public.communities SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0) WHERE id = ?",
                    communityId);
        }
    }

    List<CommunityView> views(List<Community> communities, Set<UUID> joined) {
        return communities.stream().map(c -> CommunityView.of(c, joined.contains(c.getId()))).toList();
    }

    private void requireCommunity(UUID communityId) {
        if (!communityRepository.existsById(communityId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Community not found");
        }
    }
}
