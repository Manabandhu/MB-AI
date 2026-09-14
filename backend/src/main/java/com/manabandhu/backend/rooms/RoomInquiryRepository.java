package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomInquiryRepository extends JpaRepository<RoomInquiry, UUID> {
    List<RoomInquiry> findByRoomIdOrderByCreatedAtDesc(UUID roomId);
    List<RoomInquiry> findBySenderIdOrderByCreatedAtDesc(UUID senderId);
    List<RoomInquiry> findByHostIdOrderByCreatedAtDesc(UUID hostId);
}
