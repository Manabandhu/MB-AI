package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ListingCategoryRepository extends JpaRepository<ListingCategory, UUID> {
    List<ListingCategory> findAllByOrderByNameAsc();

    boolean existsBySlug(String slug);
}
