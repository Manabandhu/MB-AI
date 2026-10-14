package com.manabandhu.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.util.Set;

import graphql.execution.ExecutionStepInfo;
import graphql.execution.ResultPath;
import graphql.schema.DataFetchingEnvironment;
import graphql.schema.DataFetchingEnvironmentImpl;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.graphql.execution.ErrorType;

class GraphqlExceptionResolverTest {

    private final GraphqlExceptionResolver resolver = new GraphqlExceptionResolver();

    private static DataFetchingEnvironment environment() {
        var stepInfo = ExecutionStepInfo.newExecutionStepInfo()
                .type(graphql.Scalars.GraphQLString).path(ResultPath.rootPath()).build();
        return DataFetchingEnvironmentImpl.newDataFetchingEnvironment().executionStepInfo(stepInfo)
                .mergedField(graphql.execution.MergedField.newMergedField(new graphql.language.Field("createEvent")).build())
                .build();
    }

    @Test
    @SuppressWarnings("unchecked")
    void constraintViolationsAreBadRequestsWithAGenericMessage() {
        var violation = (ConstraintViolation<Object>) mock(ConstraintViolation.class);
        var exception = new ConstraintViolationException("title: must not be blank (internal detail)", Set.of(violation));

        var error = resolver.resolveToSingleError(exception, environment());

        assertThat(error).isNotNull();
        assertThat(error.getErrorType()).isEqualTo(ErrorType.BAD_REQUEST);
        assertThat(error.getMessage()).isEqualTo("Invalid request");
    }
}
