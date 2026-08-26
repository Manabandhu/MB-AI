package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JobApplicationService {

    private final JobApplicationRepository repository;
    private final JobPostingRepository postingRepository;

    JobApplicationService(JobApplicationRepository repository, JobPostingRepository postingRepository) {
        this.repository = repository;
        this.postingRepository = postingRepository;
    }

    @Transactional(readOnly = true)
    public List<JobApplication> findByJobId(UUID jobId) {
        return repository.findByJobPostingIdOrderByAppliedAtDesc(jobId);
    }

    @Transactional
    public JobApplication create(UUID jobId, UUID applicantId, String coverLetter, String resumeUrl) {
        var posting = postingRepository.findById(jobId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job posting not found"));
        var application = new JobApplication(posting.id, applicantId, coverLetter, resumeUrl, "submitted");
        return repository.save(application);
    }

    @Transactional
    public JobApplication updateStatus(UUID id, String status) {
        var application = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Application not found"));
        application.status = status;
        application.updatedAt = java.time.Instant.now();
        return repository.save(application);
    }
}
