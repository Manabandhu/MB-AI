package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomAmenityCatalogRepository extends JpaRepository<RoomAmenityCatalog, UUID> {
    List<RoomAmenityCatalog> findByIsActiveTrueOrderBySortOrderAsc();
}
