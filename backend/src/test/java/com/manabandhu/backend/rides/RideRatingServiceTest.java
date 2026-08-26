package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class RideRatingServiceTest {

    @Mock
    RideRatingRepository ratingRepository;

    @Mock
    RideOfferRepository offerRepository;

    @InjectMocks
    RideRatingService service;

    @Test
    void createMapsInputToEntity() {
        var rideId = UUID.randomUUID();
        var raterId = UUID.randomUUID();
        var rateeId = UUID.randomUUID();
        var input = new CreateRideRatingInput(rateeId, 5, "Great ride!");
        when(offerRepository.existsById(rideId)).thenReturn(true);
        when(ratingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var rating = service.create(rideId, raterId, input);
        assertThat(rating.getRating()).isEqualTo(5);
        assertThat(rating.getRaterId()).isEqualTo(raterId);
        assertThat(rating.getRateeId()).isEqualTo(rateeId);
    }

    @Test
    void createThrowsBadRequestForSelfRating() {
        var rideId = UUID.randomUUID();
        var raterId = UUID.randomUUID();
        var input = new CreateRideRatingInput(raterId, 5, "Great ride!");
        when(offerRepository.existsById(rideId)).thenReturn(true);
        assertThatThrownBy(() -> service.create(rideId, raterId, input))
                .isInstanceOf(ResponseStatusException.class);
    }
}
