package com.manabandhu.backend.config;

import java.util.NoSuchElementException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Maps failures to stable HTTP statuses. Every error body is RFC 9457 problem+json ({@code status}, {@code title},
 * {@code detail}) and also carries {@code error} and {@code message} with the same text, so clients read one shape for
 * service rules and framework (validation, binding) errors alike. Client errors carry their reason; server errors
 * never expose exception messages, SQL, or class names.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ProblemDetail> status(ResponseStatusException exception) {
        var status = HttpStatus.valueOf(exception.getStatusCode().value());
        if (status.is5xxServerError()) {
            log.error("Request failed: {}", exception.getReason(), exception);
        }
        var reason = exception.getReason() != null ? exception.getReason() : status.getReasonPhrase();
        return body(status, reason);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ProblemDetail> accessDenied(AccessDeniedException exception) {
        return body(HttpStatus.FORBIDDEN, "Access denied");
    }

    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<ProblemDetail> notFound(NoSuchElementException exception) {
        return body(HttpStatus.NOT_FOUND, "Resource not found");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ProblemDetail> badRequest(IllegalArgumentException exception) {
        return body(HttpStatus.BAD_REQUEST, "Invalid request value");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ProblemDetail> conflict(DataIntegrityViolationException exception) {
        log.warn("Data integrity violation: {}", exception.getMostSpecificCause().getMessage());
        return body(HttpStatus.CONFLICT, "Request conflicts with existing data");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> unexpected(Exception exception) {
        log.error("Unhandled request failure", exception);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
    }

    /** Framework errors (bean validation, unreadable bodies, unsupported methods) get the same extra fields. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception exception, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        var response = super.handleExceptionInternal(exception, body, headers, statusCode, request);
        if (response != null && response.getBody() instanceof ProblemDetail problem) {
            var message = exception instanceof MethodArgumentNotValidException invalid
                    && invalid.getBindingResult().getFieldError() != null
                    ? invalid.getBindingResult().getFieldError().getField() + ": "
                            + invalid.getBindingResult().getFieldError().getDefaultMessage()
                    : problem.getDetail();
            if (message == null) message = HttpStatus.valueOf(statusCode.value()).getReasonPhrase();
            problem.setDetail(message);
            problem.setProperty("error", message);
            problem.setProperty("message", message);
        }
        return response;
    }

    static ResponseEntity<ProblemDetail> body(HttpStatus status, String message) {
        var problem = ProblemDetail.forStatusAndDetail(status, message);
        problem.setProperty("error", message);
        problem.setProperty("message", message);
        return ResponseEntity.status(status).body(problem);
    }
}
