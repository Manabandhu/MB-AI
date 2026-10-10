package com.manabandhu.backend.referrals;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ReferralVisibilityTest {

    @Mock
    ReferralRepository referrals;

    @Mock
    ReferralRequestRepository requests;

    ReferralService referralService;
    ReferralRequestService requestService;

    private final UUID ownerId = UUID.randomUUID();
    private final Actor owner = new Actor(ownerId, false, false);
    private final Actor stranger = new Actor(UUID.randomUUID(), false, false);
    private final Actor admin = new Actor(UUID.randomUUID(), true, false);
    private final UUID referralId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        referralService = new ReferralService(referrals);
        requestService = new ReferralRequestService(requests, referralService);
    }

    private Referral referral(String status) {
        return new Referral(ownerId, null, "request", "Need a referral", "details", status);
    }

    private void stored(String status) {
        when(referrals.findById(referralId)).thenReturn(Optional.of(referral(status)));
    }

    @Test
    void openReferralDetailsAreVisibleToMembers() {
        stored("pending");
        when(requests.findByReferralId(referralId)).thenReturn(null);

        assertThat(requestService.findForViewer(stranger, referralId)).isEmpty();
        verify(requests).findByReferralId(referralId);
    }

    @Test
    void closedReferralDetailsAreHiddenFromStrangers() {
        stored("closed");

        assertThatThrownBy(() -> requestService.findForViewer(stranger, referralId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
        assertThatThrownBy(() -> referralService.viewFor(stranger, referralId))
                .isInstanceOf(ResponseStatusException.class);
        verify(requests, never()).findByReferralId(referralId);
    }

    @Test
    void ownerAndAdminStillSeeClosedReferrals() {
        var referral = referral("closed");

        assertThat(ReferralService.canView(owner, referral)).isTrue();
        assertThat(ReferralService.canView(admin, referral)).isTrue();
    }

    @Test
    void statusComparisonIgnoresCase() {
        var referral = referral("Pending");

        assertThat(ReferralService.canView(stranger, referral)).isTrue();
    }
}
