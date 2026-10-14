package com.manabandhu.backend.immigration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ImmigrationResourceVisibilityTest {

    private final ImmigrationResourceRepository repository = mock(ImmigrationResourceRepository.class);
    private final ImmigrationResourceService service = new ImmigrationResourceService(repository);
    private final UUID submitter = UUID.randomUUID();

    @Test
    void anonymousReadersOnlyGetVerifiedResourcesWithoutSubmitterIds() {
        var verified = new ImmigrationResource(submitter, "OPT guide", "d", "OPT", "https://uscis.gov", ImmigrationResource.ResourceType.GUIDE, null, true);
        when(repository.findVisible(isNull(), isNull(), any())).thenReturn(List.of(verified));

        var list = service.listVisible(Optional.empty(), null);

        assertThat(list).singleElement().satisfies(view -> {
            assertThat(view.mine()).isFalse();
            assertThat(ImmigrationResourceView.class.getRecordComponents())
                    .noneMatch(c -> c.getName().equals("ownerId"));
        });
        verify(repository, never()).findAllByOrderByCreatedAtDesc(any());
    }

    @Test
    void unverifiedSubmissionsAreHiddenFromOthers() {
        var pending = new ImmigrationResource(submitter, "Tip", "d", "OPT", null, ImmigrationResource.ResourceType.LINK, null, false);
        when(repository.findById(pending.getId())).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> service.viewFor(Optional.of(new Actor(UUID.randomUUID(), false, false)), pending.getId()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
        assertThat(service.viewFor(Optional.of(new Actor(submitter, false, false)), pending.getId()).mine()).isTrue();
    }
}
