package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ImmigrationNewsRepository extends JpaRepository<ImmigrationNews, UUID> {
    List<ImmigrationNews> findAllByOrderByCreatedAtDesc();
    List<ImmigrationNews> findByCategoryOrderByPublishedAtDesc(String category);
}
