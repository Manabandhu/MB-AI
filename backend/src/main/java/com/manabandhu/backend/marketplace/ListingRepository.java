package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

interface ListingRepository extends JpaRepository<Listing, UUID> {
    List<Listing> findByStatusOrderByCreatedAtDesc(String status);

    List<Listing> findByCategoryIdAndStatusOrderByCreatedAtDesc(UUID categoryId, String status);

    List<Listing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Page<Listing> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
