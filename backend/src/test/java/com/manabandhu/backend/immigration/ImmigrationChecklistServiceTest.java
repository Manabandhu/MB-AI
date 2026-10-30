package com.manabandhu.backend.immigration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ImmigrationChecklistServiceTest {

    @Mock
    ImmigrationChecklistRepository repository;

    @InjectMocks
    ImmigrationChecklistService service;

    private final Actor owner = new Actor(UUID.randomUUID(), false, false);
    private final Actor stranger = new Actor(UUID.randomUUID(), false, false);

    @Test
    void listsOnlyTheCallersChecklists() {
        when(repository.findByOwnerIdOrderByCreatedAtDesc(eq(owner.id()), any(Pageable.class))).thenReturn(List.of());

        assertThat(service.findForOwner(owner, null)).isEmpty();

        verify(repository).findByOwnerIdOrderByCreatedAtDesc(eq(owner.id()), any(Pageable.class));
        verify(repository, never()).findAll();
    }

    @Test
    void categoryFilterStaysScopedToTheCaller() {
        when(repository.findByOwnerIdAndCategoryOrderByCreatedAtDesc(eq(owner.id()), eq("OPT"), any(Pageable.class)))
                .thenReturn(List.of());

        assertThat(service.findForOwner(owner, "OPT")).isEmpty();
    }

    @Test
    void strangerCannotCompleteSomeoneElsesChecklist() {
        var checklist = new ImmigrationChecklist(owner.id(), "OPT", null, "OPT", "[]", null);
        var id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(checklist));

        assertThatThrownBy(() -> service.complete(stranger, id))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
        assertThat(checklist.getCompletedAt()).isNull();
    }
}
