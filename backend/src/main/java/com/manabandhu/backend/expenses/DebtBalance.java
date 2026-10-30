package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.util.UUID;

/** Net amount {@code fromUserId} still owes {@code toUserId} within one group. */
public record DebtBalance(UUID groupId, String groupName, UUID fromUserId, UUID toUserId, BigDecimal amount, String currency) {}
