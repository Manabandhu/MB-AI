package com.manabandhu.backend.config;

import java.util.Map;
import java.util.NoSuchElementException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Maps failures to stable HTTP statuses. Client errors carry their reason; server errors never expose
 * exception messages, SQL, or class names.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, String>> status(ResponseStatusException exception) {
        var status = HttpStatus.valueOf(exception.getStatusCode().value());
        if (status.is5xxServerError()) {
            log.error("Request failed: {}", exception.getReason(), exception);
        }
        var reason = exception.getReason() != null ? exception.getReason() : status.getReasonPhrase();
        return body(status, reason);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, String>> accessDenied(AccessDeniedException exception) {
        return body(HttpStatus.FORBIDDEN, "Access denied");
    }

    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<Map<String, String>> notFound(NoSuchElementException exception) {
        return body(HttpStatus.NOT_FOUND, "Resource not found");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException exception) {
        return body(HttpStatus.BAD_REQUEST, "Invalid request value");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, String>> conflict(DataIntegrityViolationException exception) {
        log.warn("Data integrity violation: {}", exception.getMostSpecificCause().getMessage());
        return body(HttpStatus.CONFLICT, "Request conflicts with existing data");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, String>> unexpected(Exception exception) {
        log.error("Unhandled request failure", exception);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
    }

    private static ResponseEntity<Map<String, String>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message, "message", message));
    }
}
