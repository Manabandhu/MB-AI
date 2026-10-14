package com.manabandhu.backend.jobs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

class JobPostingServiceTest {

    private final JobPostingRepository repository = mock(JobPostingRepository.class);
    private final JobPostingService service = new JobPostingService(repository, mock(JobCategoryRepository.class));
    private final UUID ownerId = UUID.randomUUID();
    private final Actor owner = new Actor(ownerId, false, false);
    private final Actor stranger = new Actor(UUID.randomUUID(), false, false);
    private final Actor admin = new Actor(UUID.randomUUID(), true, false);
    private JobPosting posting;

    @BeforeEach
    void setUp() {
        posting = new JobPosting(ownerId, null, "SWE", "Acme", "Irving", "d", "Full-time", false, 100, 200,
                "https://acme.example/jobs", "open");
        when(repository.findById(posting.id)).thenReturn(Optional.of(posting));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static UpdateJobPostingInput input(String company, String status, Integer min, Integer max, Boolean clear) {
        return new UpdateJobPostingInput(null, null, company, null, null, null, null, min, max, null, status, clear);
    }

    private static int status(Throwable error) {
        return ((ResponseStatusException) error).getStatusCode().value();
    }

    @Test
    void strangerCannotUpdateOrDelete() {
        assertThatThrownBy(() -> service.update(stranger, posting.id, input("X", null, null, null, null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(403));
        assertThatThrownBy(() -> service.delete(stranger, posting.id))
                .satisfies(e -> assertThat(status(e)).isEqualTo(403));
        verify(repository, never()).save(any());
        verify(repository, never()).delete(any());
    }

    @Test
    void ownerAndAdminCanUpdateAndDelete() {
        assertThat(service.update(owner, posting.id, input("Beta", null, null, null, null)).getCompany()).isEqualTo("Beta");
        assertThat(service.update(admin, posting.id, input(null, "CLOSED", null, null, null)).getStatus()).isEqualTo("closed");
        service.delete(owner, posting.id);
        verify(repository).delete(posting);
    }

    @Test
    void blankClearsOptionalTextAndNullKeeps() {
        var updated = service.update(owner, posting.id,
                new UpdateJobPostingInput(null, null, "  ", null, null, "", null, null, null, "", null, null));
        assertThat(updated.getCompany()).isNull();
        assertThat(updated.getEmploymentType()).isNull();
        assertThat(updated.getApplicationUrl()).isNull();
        assertThat(updated.getLocation()).isEqualTo("Irving");
        assertThat(updated.getTitle()).isEqualTo("SWE");
    }

    @Test
    void clearSalaryEmptiesBoundsThenAppliesNewOnes() {
        var cleared = service.update(owner, posting.id, input(null, null, null, null, true));
        assertThat(cleared.getSalaryMin()).isNull();
        assertThat(cleared.getSalaryMax()).isNull();
        var onlyMax = service.update(owner, posting.id, input(null, null, null, 300, true));
        assertThat(onlyMax.getSalaryMin()).isNull();
        assertThat(onlyMax.getSalaryMax()).isEqualTo(300);
    }

    @Test
    void invalidStatusBlankTitleAndInvertedSalaryAre400() {
        assertThatThrownBy(() -> service.update(owner, posting.id, input(null, "archived", null, null, null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(400));
        assertThatThrownBy(() -> service.update(owner, posting.id,
                new UpdateJobPostingInput(null, " ", null, null, null, null, null, null, null, null, null, null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(400));
        assertThatThrownBy(() -> service.update(owner, posting.id, input(null, null, 500, 100, true)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(400));
    }

    @Test
    void missingPostingIs404() {
        var missing = UUID.randomUUID();
        when(repository.findById(missing)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(owner, missing))
                .satisfies(e -> assertThat(status(e)).isEqualTo(404));
    }

    @Test
    void mineIsTrueOnlyForTheOwnerAndTheOwnerIdIsNeverSerialized() {
        assertThat(posting.viewedBy(null).getMine()).isFalse();
        assertThat(posting.viewedBy(stranger).getMine()).isFalse();
        assertThat(posting.viewedBy(owner).getMine()).isTrue();

        var json = tools.jackson.databind.json.JsonMapper.builder().build().writeValueAsString(posting);
        assertThat(json).doesNotContain("ownerId").doesNotContain(ownerId.toString()).contains("\"mine\":true");
    }
}
