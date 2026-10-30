package com.manabandhu.backend.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.manabandhu.backend.events.EventsController;
import com.manabandhu.backend.events.EventsService;

/**
 * Service rule errors and framework errors share one body: problem+json plus {@code error}/{@code message}, which the
 * frontend's {@code readErrorDetail} reads. Pinned on the public events detail route.
 */
@WebMvcTest(controllers = EventsController.class, properties = {
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=",
        "app.supabase.jwt.issuer=https://test.supabase.co/auth/v1",
        "app.supabase.jwt.audience=authenticated",
        "app.cors.allowed-origins=http://localhost:19006"
})
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class ErrorShapeWebTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private EventsService service;

    @Test
    void serviceRuleErrorsAreProblemDetailsWithMessage() throws Exception {
        when(service.findById(any())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/events/" + UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Event not found"))
                .andExpect(jsonPath("$.message").value("Event not found"))
                .andExpect(jsonPath("$.error").value("Event not found"));
    }

    @Test
    void frameworkErrorsCarryTheSameFields() throws Exception {
        mockMvc.perform(get("/api/v1/events/not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.error").isString());
    }
}
