package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class RideMapsControllerTest {

    @Test
    void geocodeKeepsHostileInputInsideItsQueryParameter() {
        var controller = new RideMapsController("server-key");
        var server = MockRestServiceServer.bindTo((RestTemplate) ReflectionTestUtils.getField(controller, "restTemplate"))
                .build();
        server.expect(requestTo("https://maps.googleapis.com/maps/api/geocode/json"
                        + "?address=Irving%26key%3Dstolen%2F..%2F%7Bx%7D&key=server-key"))
                .andRespond(withSuccess("""
                        {"results":[{"geometry":{"location":{"lat":32.8,"lng":-96.9}}}]}""",
                        MediaType.APPLICATION_JSON));

        var location = controller.geocode("Irving&key=stolen/../{x}");

        assertThat(location.lat()).isEqualTo(32.8);
        server.verify();
    }
}
