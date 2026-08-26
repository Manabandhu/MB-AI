package com.manabandhu.backend.utilities;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PackageTrackingServiceTest {

    @Mock
    PackageTrackingRepository repository;

    @InjectMocks
    PackageTrackingService service;

    @Test
    void findByOwnerReturnsOwned() {
        var ownerId = UUID.randomUUID();
        when(repository.findByOwnerIdOrderByLastUpdateDesc(ownerId)).thenReturn(List.of());
        assertThat(service.findByOwner(ownerId)).isEmpty();
        verify(repository).findByOwnerIdOrderByLastUpdateDesc(ownerId);
    }

    @Test
    void updateStatusChangesStatus() {
        var tracking = new PackageTracking(UUID.randomUUID(), "1Z", "USPS", PackageTracking.TrackingStatus.PENDING, null);
        when(repository.findById(tracking.getId())).thenReturn(java.util.Optional.of(tracking));
        var updated = service.updateStatus(tracking.getId(), PackageTracking.TrackingStatus.DELIVERED);
        assertThat(updated.getStatus()).isEqualTo(PackageTracking.TrackingStatus.DELIVERED);
    }
}
