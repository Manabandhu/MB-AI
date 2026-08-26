package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface FaqItemRepository extends JpaRepository<FaqItem, UUID> {
    List<FaqItem> findByCategoryOrderBySortOrderAsc(String category);
    List<FaqItem> findByPublishedTrueOrderBySortOrderAsc();
}
