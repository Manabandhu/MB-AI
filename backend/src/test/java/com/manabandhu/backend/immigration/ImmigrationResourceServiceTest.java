package com.manabandhu.backend.immigration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ImmigrationResourceServiceTest {

    @Mock
    ImmigrationResourceRepository repository;

    @InjectMocks
    ImmigrationResourceService service;

    @Test
    void findAllReturnsAll() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        assertThat(service.findAll()).isEmpty();
        verify(repository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void findByOwnerReturnsOwned() {
        var ownerId = UUID.randomUUID();
        when(repository.findByOwnerIdOrderByCreatedAtDesc(ownerId)).thenReturn(List.of());
        assertThat(service.findByOwner(ownerId)).isEmpty();
        verify(repository).findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Test
    void findByCategoryReturnsCategory() {
        when(repository.findByCategoryOrderByCreatedAtDesc("GUIDES")).thenReturn(List.of());
        assertThat(service.findByCategory("GUIDES")).isEmpty();
        verify(repository).findByCategoryOrderByCreatedAtDesc("GUIDES");
    }

    @Test
    void createPersistsResource() {
        var ownerId = UUID.randomUUID();
        when(repository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));
        var resource = service.create(ownerId, "Title", "Desc", "Category", "http://example.com", ImmigrationResource.ResourceType.GUIDE, "tags", true);
        assertThat(resource.getOwnerId()).isEqualTo(ownerId);
        assertThat(resource.getTitle()).isEqualTo("Title");
        verify(repository).save(org.mockito.ArgumentMatchers.any());
    }
}
