package com.manabandhu.backend.events;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Every controller that returns {@code Page<T>} is serialized as Spring Data's {@code PagedModel}
 * ({@code spring.data.web.pageable.serialization-mode: via-dto}). Pinned here on the events list, the
 * frontend `toPage` helper and the OpenAPI page schemas depend on it.
 */
@WebMvcTest(controllers = EventsController.class, properties = {
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=",
        "app.supabase.jwt.issuer=https://test.supabase.co/auth/v1",
        "app.supabase.jwt.audience=authenticated",
        "app.cors.allowed-origins=http://localhost:19006"
})
@Import(com.manabandhu.backend.config.SecurityConfig.class)
class PagedResponseShapeWebTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private EventsService service;

    @Test
    void pageIsSerializedAsPagedModel() throws Exception {
        when(service.findAll(any(Pageable.class)))
                .thenReturn(new PageImpl<Event>(List.of(), PageRequest.of(1, 2), 5));

        mockMvc.perform(get("/api/v1/events").param("page", "1").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page.size").value(2))
                .andExpect(jsonPath("$.page.number").value(1))
                .andExpect(jsonPath("$.page.totalElements").value(5))
                .andExpect(jsonPath("$.page.totalPages").value(3))
                .andExpect(jsonPath("$.totalElements").doesNotExist())
                .andExpect(jsonPath("$.last").doesNotExist())
                .andExpect(jsonPath("$.pageable").doesNotExist());
    }
}
