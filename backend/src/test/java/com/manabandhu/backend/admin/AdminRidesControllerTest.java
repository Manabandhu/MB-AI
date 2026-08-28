package com.manabandhu.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.manabandhu.backend.rides.RideOffer;
import com.manabandhu.backend.rides.RideOfferService;

class AdminRidesControllerTest {

    @Test
    void unauthenticatedRequestIsRejected() {
        var service = mock(RideOfferService.class);
        var policy = mock(AdminAccessPolicy.class);
        var controller = new AdminRidesController(service, policy);

        var authentication = mock(Authentication.class);
        doThrow(new AccessDeniedException("No auth")).when(policy).require(authentication);

        assertThrows(AccessDeniedException.class, () -> controller.rides(authentication));
    }

    @Test
    void nonAdminRequestIsRejected() {
        var service = mock(RideOfferService.class);
        var policy = new AdminAccessPolicy(false);
        var controller = new AdminRidesController(service, policy);

        var user = new UsernamePasswordAuthenticationToken("user-1", "n/a", List.of());

        assertThrows(AccessDeniedException.class, () -> controller.rides(user));
    }

    @Test
    void adminRequestReturnsProjection() {
        var service = mock(RideOfferService.class);
        var policy = new AdminAccessPolicy(false);
        var controller = new AdminRidesController(service, policy);

        var offerId = UUID.randomUUID();
        var driverId = UUID.randomUUID();
        var offer = mock(RideOffer.class);
        when(offer.getId()).thenReturn(offerId);
        when(offer.getOriginArea()).thenReturn("Irving");
        when(offer.getDestinationArea()).thenReturn("DFW");
        when(offer.getDriverId()).thenReturn(driverId);
        when(offer.getStatus()).thenReturn("active");
        when(offer.getCreatedAt()).thenReturn(java.time.Instant.now());
        when(service.findAllForAdmin()).thenReturn(List.of(offer));

        var admin = new UsernamePasswordAuthenticationToken(
                "admin-1", "n/a", List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));

        var result = controller.rides(admin);

        assertThat(result).hasSize(1);
        var projection = result.get(0);
        assertThat(projection.id()).isEqualTo(offerId);
        assertThat(projection.from()).isEqualTo("Irving");
        assertThat(projection.to()).isEqualTo("DFW");
        assertThat(projection.driverId()).isEqualTo(driverId.toString());
        assertThat(projection.status()).isEqualTo("active");
        assertThat(projection.reported()).isFalse();
    }

    @Test
    void emptyResultsReturnEmptyList() {
        var service = mock(RideOfferService.class);
        var policy = new AdminAccessPolicy(false);
        var controller = new AdminRidesController(service, policy);

        when(service.findAllForAdmin()).thenReturn(List.of());

        var admin = new UsernamePasswordAuthenticationToken(
                "admin-1", "n/a", List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));

        var result = controller.rides(admin);

        assertThat(result).isEmpty();
    }
}
