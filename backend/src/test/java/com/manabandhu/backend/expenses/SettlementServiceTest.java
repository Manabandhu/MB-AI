package com.manabandhu.backend.expenses;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class SettlementServiceTest {

    private final SettlementRepository repository = mock(SettlementRepository.class);
    private final ExpenseAccess access = mock(ExpenseAccess.class);
    private final SettlementService service = new SettlementService(repository, access);
    private final UUID groupId = UUID.randomUUID();
    private final UUID debtorId = UUID.randomUUID();
    private final UUID creditorId = UUID.randomUUID();
    private final Actor debtor = new Actor(debtorId, false, false);
    private final Actor creditor = new Actor(creditorId, false, false);

    @BeforeEach
    void setUp() {
        var group = mock(ExpenseGroup.class);
        lenient().when(group.getOwnerId()).thenReturn(creditorId);
        lenient().when(group.getCurrency()).thenReturn("USD");
        lenient().when(access.requireMember(any(), any())).thenReturn(group);
        lenient().when(access.isMember(any(), any())).thenReturn(true);
        lenient().when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private CreateSettlementInput input(String status) {
        return new CreateSettlementInput(debtorId, creditorId, new BigDecimal("25.00"), "USD", status);
    }

    private static HttpStatus status(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @Test
    void debtorCannotCompleteASettlementAlone() {
        var settlement = service.create(debtor, groupId, input("completed"));

        assertThat(settlement.getStatus()).isEqualTo("pending");
        assertThat(settlement.getSettledAt()).isNull();
    }

    @Test
    void creditorRecordingAReceivedPaymentCompletesIt() {
        var before = Instant.now();
        var settlement = service.create(creditor, groupId, input(null));

        assertThat(settlement.getStatus()).isEqualTo("completed");
        assertThat(settlement.getSettledAt()).isAfterOrEqualTo(before);
    }

    @Test
    void duplicatePendingSettlementIsRejected() {
        when(repository.existsByGroupIdAndFromUserIdAndToUserIdAndStatus(groupId, debtorId, creditorId, "pending"))
                .thenReturn(true);

        assertThatThrownBy(() -> service.create(debtor, groupId, input(null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(repository, never()).save(any());
    }

    private Settlement stored(String status) {
        var settlement = new Settlement(groupId, debtorId, creditorId, new BigDecimal("25.00"), "USD", status, null);
        when(repository.findByIdForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        return settlement;
    }

    @Test
    void debtorCannotConfirmTheirOwnPayment() {
        var settlement = stored("pending");

        assertThatThrownBy(() -> service.updateStatus(debtor, settlement.getId(), "completed"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(settlement.getStatus()).isEqualTo("pending");
    }

    @Test
    void creditorConfirmsAndTheServerSetsSettledAt() {
        var settlement = stored("pending");

        var result = service.updateStatus(creditor, settlement.getId(), "COMPLETED");

        assertThat(result.getStatus()).isEqualTo("completed");
        assertThat(result.getSettledAt()).isNotNull();
    }

    @Test
    void completedSettlementsAreFinal() {
        var settlement = stored("completed");

        assertThatThrownBy(() -> service.updateStatus(creditor, settlement.getId(), "cancelled"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        assertThatThrownBy(() -> service.updateStatus(creditor, settlement.getId(), "pending"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void eitherPartyCanCancelAPendingSettlement() {
        var settlement = stored("pending");

        assertThat(service.updateStatus(debtor, settlement.getId(), "cancelled").getStatus()).isEqualTo("cancelled");
    }

    @Test
    void strangersCannotTouchASettlement() {
        var settlement = stored("pending");

        assertThatThrownBy(() -> service.updateStatus(new Actor(UUID.randomUUID(), false, false), settlement.getId(), "cancelled"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
