package com.manabandhu.backend.admin;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
class UnknownAutomationOperationException extends RuntimeException {
    UnknownAutomationOperationException(String id) {
        super("Unknown automation operation: " + id);
    }
}
