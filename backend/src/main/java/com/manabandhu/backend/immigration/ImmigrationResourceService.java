package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImmigrationResourceService {

    private final ImmigrationResourceRepository repository;

    ImmigrationResourceService(ImmigrationResourceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ImmigrationResource> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public java.util.Optional<ImmigrationResource> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<ImmigrationResource> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public List<ImmigrationResource> findByCategory(String category) {
        return repository.findByCategoryOrderByCreatedAtDesc(category);
    }

    static final int MAX_RESULTS = 200;

    /**
     * Published resources for readers: verified ones for everyone, plus the caller's own unreviewed submissions
     * (admins see everything). Newest first, capped at {@link #MAX_RESULTS}; submitter ids are never returned.
     */
    @Transactional(readOnly = true)
    public java.util.List<ImmigrationResourceView> listVisible(java.util.Optional<com.manabandhu.backend.auth.Actor> caller,
                                                               String category) {
        var callerId = caller.map(com.manabandhu.backend.auth.Actor::id).orElse(null);
        var admin = caller.map(com.manabandhu.backend.auth.Actor::admin).orElse(false);
        var page = org.springframework.data.domain.PageRequest.of(0, MAX_RESULTS);
        var rows = admin
                ? (category == null ? repository.findAllByOrderByCreatedAtDesc(page) : repository.findByCategoryOrderByCreatedAtDesc(category, page))
                : repository.findVisible(callerId, category, page);
        return rows.stream().map(r -> ImmigrationResourceView.of(r, callerId)).toList();
    }

    /** One resource if the caller may see it (verified, theirs, or admin); 404 otherwise. */
    @Transactional(readOnly = true)
    public ImmigrationResourceView viewFor(java.util.Optional<com.manabandhu.backend.auth.Actor> caller, UUID id) {
        var callerId = caller.map(com.manabandhu.backend.auth.Actor::id).orElse(null);
        var admin = caller.map(com.manabandhu.backend.auth.Actor::admin).orElse(false);
        return repository.findById(id)
                .filter(r -> r.isVerified() || admin || (callerId != null && callerId.equals(r.getOwnerId())))
                .map(r -> ImmigrationResourceView.of(r, callerId))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Resource not found"));
    }

    @Transactional
    public ImmigrationResource create(UUID ownerId, String title, String description, String category, String url, ImmigrationResource.ResourceType resourceType, String tags, boolean verified) {
        return repository.save(new ImmigrationResource(ownerId, title, description, category, url, resourceType, tags, verified));
    }
}
