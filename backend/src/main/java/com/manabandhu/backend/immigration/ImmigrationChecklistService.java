package com.manabandhu.backend.immigration;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.Paging;

@Service
public class ImmigrationChecklistService {

    private final ImmigrationChecklistRepository repository;

    ImmigrationChecklistService(ImmigrationChecklistRepository repository) {
        this.repository = repository;
    }

    /** Checklists are personal: callers only ever see their own, newest first, capped at {@link Paging#LIST_CAP}. */

    @Transactional(readOnly = true)
    public List<ImmigrationChecklist> findForOwner(Actor actor, String category) {
        var page = Paging.firstPage();
        return category == null || category.isBlank()
                ? repository.findByOwnerIdOrderByCreatedAtDesc(actor.id(), page)
                : repository.findByOwnerIdAndCategoryOrderByCreatedAtDesc(actor.id(), category, page);
    }

    @Transactional
    public ImmigrationChecklist create(UUID ownerId, String title, String description, String category, String itemsJson, Instant dueDate) {
        return repository.save(new ImmigrationChecklist(ownerId, title, description, category, itemsJson, dueDate));
    }

    @Transactional
    public ImmigrationChecklist complete(Actor actor, UUID id) {
        var checklist = repository.findById(id).orElseThrow();
        actor.requireOwner(checklist.getOwnerId(), "Only the owner can complete this checklist");
        checklist.markCompleted();
        return checklist;
    }
}
