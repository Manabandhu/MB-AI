package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.UUID;

import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {
    List<JobApplication> findByJobPostingIdOrderByAppliedAtDesc(UUID jobPostingId);

    long countByApplicantId(UUID applicantId);

    boolean existsByJobPostingIdAndApplicantIdAndStatusNot(UUID jobPostingId, UUID applicantId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM JobApplication a WHERE a.id = :id")
    Optional<JobApplication> findByIdForUpdate(@Param("id") UUID id);
}
