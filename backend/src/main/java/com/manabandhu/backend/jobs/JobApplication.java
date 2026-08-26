package com.manabandhu.backend.jobs;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "job_applications")
public class JobApplication {

    @Id
    UUID id;

    @Column(name = "job_posting_id", nullable = false, updatable = false)
    UUID jobPostingId;

    @Column(name = "applicant_id", nullable = false, updatable = false)
    UUID applicantId;

    @Column(length = 4000)
    String coverLetter;

    @Column(name = "resume_url", length = 500)
    String resumeUrl;

    @Column(nullable = false, length = 20)
    String status;

    @Column(name = "applied_at", nullable = false, updatable = false)
    Instant appliedAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    protected JobApplication() {}

    JobApplication(UUID jobPostingId, UUID applicantId, String coverLetter, String resumeUrl, String status) {
        this.id = UUID.randomUUID();
        this.jobPostingId = jobPostingId;
        this.applicantId = applicantId;
        this.coverLetter = coverLetter;
        this.resumeUrl = resumeUrl;
        this.status = status;
        this.appliedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getJobPostingId() { return jobPostingId; }
    public UUID getApplicantId() { return applicantId; }
    public String getCoverLetter() { return coverLetter; }
    public String getResumeUrl() { return resumeUrl; }
    public String getStatus() { return status; }
    public Instant getAppliedAt() { return appliedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
