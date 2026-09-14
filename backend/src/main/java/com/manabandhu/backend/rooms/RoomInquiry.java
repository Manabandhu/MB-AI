package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_inquiries")
public class RoomInquiry {

    @Id
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "host_id", nullable = false)
    private UUID hostId;

    @Column(name = "conversation_id")
    private UUID conversationId;

    @Column(name = "move_in_date", nullable = false)
    private LocalDate moveInDate;

    @Column(name = "stay_duration_months")
    private Integer stayDurationMonths;

    @Column(name = "dietary_lifestyle", length = 50)
    private String dietaryLifestyle;

    @Column(name = "intro_message", nullable = false, columnDefinition = "TEXT")
    private String introMessage;

    @Column(length = 50, nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected RoomInquiry() {}

    public RoomInquiry(UUID roomId, UUID senderId, UUID hostId, UUID conversationId,
                       LocalDate moveInDate, Integer stayDurationMonths,
                       String dietaryLifestyle, String introMessage) {
        this.id = UUID.randomUUID();
        this.roomId = roomId;
        this.senderId = senderId;
        this.hostId = hostId;
        this.conversationId = conversationId;
        this.moveInDate = moveInDate;
        this.stayDurationMonths = stayDurationMonths != null ? stayDurationMonths : 6;
        this.dietaryLifestyle = dietaryLifestyle;
        this.introMessage = introMessage;
        this.status = "PENDING";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public UUID getSenderId() { return senderId; }
    public UUID getHostId() { return hostId; }
    public UUID getConversationId() { return conversationId; }
    public LocalDate getMoveInDate() { return moveInDate; }
    public Integer getStayDurationMonths() { return stayDurationMonths; }
    public String getDietaryLifestyle() { return dietaryLifestyle; }
    public String getIntroMessage() { return introMessage; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }
}
