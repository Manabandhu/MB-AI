package com.manabandhu.backend.jobs;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "job_postings")
public class JobPosting {

    @Id
    UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    UUID ownerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    JobCategory category;

    @Column(nullable = false, length = 200)
    String title;

    @Column(length = 200)
    String company;

    @Column(length = 200)
    String location;

    @Column(length = 4000)
    String description;

    @Column(name = "employment_type", length = 50)
    String employmentType;

    @Column(name = "is_remote")
    Boolean isRemote;

    @Column(name = "salary_min")
    Integer salaryMin;

    @Column(name = "salary_max")
    Integer salaryMax;

    @Column(name = "application_url", length = 500)
    String applicationUrl;

    @Column(nullable = false, length = 20)
    String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    protected JobPosting() {}

    JobPosting(UUID ownerId, JobCategory category, String title, String company, String location, String description,
               String employmentType, Boolean isRemote, Integer salaryMin, Integer salaryMax, String applicationUrl, String status) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.category = category;
        this.title = title;
        this.company = company;
        this.location = location;
        this.description = description;
        this.employmentType = employmentType;
        this.isRemote = isRemote;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.applicationUrl = applicationUrl;
        this.status = status;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public JobCategory getCategory() { return category; }
    public String getTitle() { return title; }
    public String getCompany() { return company; }
    public String getLocation() { return location; }
    public String getDescription() { return description; }
    public String getEmploymentType() { return employmentType; }
    public Boolean getIsRemote() { return isRemote; }
    public Integer getSalaryMin() { return salaryMin; }
    public Integer getSalaryMax() { return salaryMax; }
    public String getApplicationUrl() { return applicationUrl; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
