package com.manabandhu.backend.config;

import java.util.NoSuchElementException;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Gives GraphQL clients the same status semantics as REST without leaking internal messages. */
@Component
public class GraphqlExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable exception, DataFetchingEnvironment environment) {
        if (exception instanceof ResponseStatusException status) {
            var code = HttpStatus.valueOf(status.getStatusCode().value());
            if (code.is5xxServerError()) return null;
            return error(environment, typeFor(code), status.getReason() != null ? status.getReason() : code.getReasonPhrase());
        }
        if (exception instanceof AccessDeniedException) {
            return error(environment, ErrorType.FORBIDDEN, "Access denied");
        }
        if (exception instanceof NoSuchElementException) {
            return error(environment, ErrorType.NOT_FOUND, "Resource not found");
        }
        if (exception instanceof IllegalArgumentException) {
            return error(environment, ErrorType.BAD_REQUEST, "Invalid request value");
        }
        return null;
    }

    private static ErrorType typeFor(HttpStatus status) {
        return switch (status) {
            case UNAUTHORIZED -> ErrorType.UNAUTHORIZED;
            case FORBIDDEN -> ErrorType.FORBIDDEN;
            case NOT_FOUND -> ErrorType.NOT_FOUND;
            default -> ErrorType.BAD_REQUEST;
        };
    }

    private static GraphQLError error(DataFetchingEnvironment environment, ErrorType type, String message) {
        return GraphqlErrorBuilder.newError(environment).errorType(type).message(message).build();
    }
}
