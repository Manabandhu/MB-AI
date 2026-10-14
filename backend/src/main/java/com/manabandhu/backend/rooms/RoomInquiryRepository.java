package com.manabandhu.backend.rooms;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomInquiryRepository extends JpaRepository<RoomInquiry, UUID> {

    Optional<RoomInquiry> findFirstByRoomIdAndSenderIdOrderByCreatedAtDesc(UUID roomId, UUID senderId);
}
