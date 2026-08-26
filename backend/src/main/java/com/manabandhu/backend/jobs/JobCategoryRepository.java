package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface JobCategoryRepository extends JpaRepository<JobCategory, UUID> {
    List<JobCategory> findAllByOrderByNameAsc();

    boolean existsBySlug(String slug);
}
