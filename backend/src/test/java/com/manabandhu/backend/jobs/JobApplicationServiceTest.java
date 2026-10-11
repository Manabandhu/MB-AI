package com.manabandhu.backend.jobs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class JobApplicationServiceTest {

    private final JobApplicationRepository repository = mock(JobApplicationRepository.class);
    private final JobPostingRepository postings = mock(JobPostingRepository.class);
    private final JobApplicationService service = new JobApplicationService(repository, postings);
    private final UUID employerId = UUID.randomUUID();
    private final UUID applicantId = UUID.randomUUID();
    private final Actor employer = new Actor(employerId, false, false);
    private final Actor applicant = new Actor(applicantId, false, false);
    private JobPosting posting;

    @BeforeEach
    void setUp() {
        posting = new JobPosting(employerId, null, "SWE", "Acme", "Irving", "d", "FULL_TIME", false, null, null, null, "open");
        lenient().when(postings.findById(posting.id)).thenReturn(Optional.of(posting));
        lenient().when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static HttpStatus status(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    private JobApplication stored(String status) {
        var application = new JobApplication(posting.id, applicantId, "hi", null, status);
        when(repository.findByIdForUpdate(application.getId())).thenReturn(Optional.of(application));
        return application;
    }

    @Test
    void applicantCannotAcceptTheirOwnApplication() {
        var application = stored("submitted");

        assertThatThrownBy(() -> service.updateStatus(applicant, application.getId(), "accepted"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(application.getStatus()).isEqualTo("submitted");
    }

    @Test
    void employerAcceptsAndFinalStatesAreLocked() {
        var application = stored("submitted");

        assertThat(service.updateStatus(employer, application.getId(), "Accepted").getStatus()).isEqualTo("accepted");
        assertThatThrownBy(() -> service.updateStatus(employer, application.getId(), "rejected"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void applicantCanWithdrawButEmployerCannot() {
        var application = stored("reviewing");

        assertThatThrownBy(() -> service.updateStatus(employer, application.getId(), "withdrawn"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(service.updateStatus(applicant, application.getId(), "withdrawn").getStatus()).isEqualTo("withdrawn");
    }

    @Test
    void duplicateApplicationsAreRejected() {
        when(repository.existsByJobPostingIdAndApplicantIdAndStatusNot(posting.id, applicantId, "withdrawn")).thenReturn(true);

        assertThatThrownBy(() -> service.create(posting.id, applicantId, "again", null))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(repository, never()).save(any());
    }

    @Test
    void closedJobsTakeNoApplications() {
        posting.status = "closed";

        assertThatThrownBy(() -> service.create(posting.id, applicantId, "hi", null))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void employersCannotApplyToTheirOwnPosting() {
        assertThatThrownBy(() -> service.create(posting.id, employerId, "hi", null))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void strangersCannotListApplicants() {
        assertThatThrownBy(() -> service.listForJob(new Actor(UUID.randomUUID(), false, false), posting.id))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
