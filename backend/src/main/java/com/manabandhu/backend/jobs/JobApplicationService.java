package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class JobApplicationService {

    private final JobApplicationRepository repository;
    private final JobPostingRepository postingRepository;

    JobApplicationService(JobApplicationRepository repository, JobPostingRepository postingRepository) {
        this.repository = repository;
        this.postingRepository = postingRepository;
    }

    static final String SUBMITTED = "submitted";
    static final String REVIEWING = "reviewing";
    static final String SHORTLISTED = "shortlisted";
    static final String ACCEPTED = "accepted";
    static final String REJECTED = "rejected";
    static final String WITHDRAWN = "withdrawn";
    private static final Set<String> FINAL = Set.of(ACCEPTED, REJECTED, WITHDRAWN);
    /** Statuses only the employer (posting owner) or an admin may set. */
    private static final Set<String> EMPLOYER = Set.of(REVIEWING, SHORTLISTED, ACCEPTED, REJECTED);

    /** Applicants for a job: the posting owner and admins only. */
    @Transactional(readOnly = true)
    public List<JobApplication> listForJob(Actor actor, UUID jobId) {
        var posting = requirePosting(jobId);
        actor.requireOwner(posting.getOwnerId(), "Not authorized to view applicants for this job");
        return repository.findByJobPostingIdOrderByAppliedAtDesc(jobId);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<JobApplication> findById(UUID id) {
        return repository.findById(id);
    }

    /** One live application per person and job, only while the job is open, never on your own posting. */
    @Transactional
    public JobApplication create(UUID jobId, UUID applicantId, String coverLetter, String resumeUrl) {
        var posting = requirePosting(jobId);
        if (!"open".equalsIgnoreCase(posting.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This job is no longer accepting applications");
        }
        if (applicantId.equals(posting.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot apply to your own job posting");
        }
        if (repository.existsByJobPostingIdAndApplicantIdAndStatusNot(jobId, applicantId, WITHDRAWN)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already applied to this job");
        }
        var application = new JobApplication(posting.id, applicantId, coverLetter, resumeUrl, SUBMITTED);
        return repository.save(application);
    }

    /**
     * The employer (or an admin) moves an application through reviewing, shortlisted, accepted or rejected; the
     * applicant may only withdraw. Accepted, rejected and withdrawn are final.
     */
    @Transactional
    public JobApplication updateStatus(Actor actor, UUID id, String rawStatus) {
        var status = rawStatus == null ? "" : rawStatus.trim().toLowerCase(Locale.ROOT);
        if (!EMPLOYER.contains(status) && !WITHDRAWN.equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status must be one of reviewing, shortlisted, accepted, rejected, withdrawn");
        }
        var application = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        var posting = requirePosting(application.getJobPostingId());
        if (WITHDRAWN.equals(status)) {
            actor.requireAnyOf("Only the applicant can withdraw this application", application.getApplicantId());
        } else {
            actor.requireOwner(posting.getOwnerId(), "Only the employer can change this application");
        }
        var current = application.getStatus() == null ? SUBMITTED : application.getStatus().toLowerCase(Locale.ROOT);
        if (status.equals(current)) {
            return application;
        }
        if (FINAL.contains(current)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A " + current + " application cannot change");
        }
        application.status = status;
        application.updatedAt = java.time.Instant.now();
        return repository.save(application);
    }

    private JobPosting requirePosting(UUID jobId) {
        return postingRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found"));
    }
}
