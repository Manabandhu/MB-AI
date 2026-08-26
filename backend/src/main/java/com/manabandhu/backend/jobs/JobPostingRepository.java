package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface JobPostingRepository extends JpaRepository<JobPosting, UUID> {
    List<JobPosting> findByStatusOrderByCreatedAtDesc(String status);

    List<JobPosting> findByCategoryIdAndStatusOrderByCreatedAtDesc(UUID categoryId, String status);

    List<JobPosting> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
