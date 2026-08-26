package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {
    List<JobApplication> findByJobPostingIdOrderByAppliedAtDesc(UUID jobPostingId);

    List<JobApplication> findByApplicantIdOrderByAppliedAtDesc(UUID applicantId);
}
