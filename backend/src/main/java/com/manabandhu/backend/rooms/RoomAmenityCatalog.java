package com.manabandhu.backend.rooms;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_amenities")
public class RoomAmenityCatalog {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "icon_name", length = 50)
    private String iconName;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected RoomAmenityCatalog() {}

    public RoomAmenityCatalog(String code, String label, String category, String iconName, boolean isActive, int sortOrder) {
        this.id = UUID.randomUUID();
        this.code = code;
        this.label = label;
        this.category = category;
        this.iconName = iconName;
        this.isActive = isActive;
        this.sortOrder = sortOrder;
    }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getLabel() { return label; }
    public String getCategory() { return category; }
    public String getIconName() { return iconName; }
    public boolean isActive() { return isActive; }
    public int getSortOrder() { return sortOrder; }
}
