package com.manabandhu.backend.rides;

import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Server-side proxy for Google Directions, Places Autocomplete, and Geocoding so the web-service key never
 * ships in the app bundle (and browsers, which these APIs block via CORS, can use them too). Returns 503 when
 * no key is configured; the client then falls back to its free estimators.
 */
@RestController
@RequestMapping("/api/v1/rides/maps")
public class RideMapsController {

    record RouteInfo(String polyline, double distanceMiles, int durationMinutes, boolean hasTolls,
                     List<String> warnings, String summary) {}

    record Prediction(String description, String placeId, String mainText, String secondaryText) {}

    record LatLng(double lat, double lng) {}

    private static final String GOOGLE = "https://maps.googleapis.com/maps/api";

    private final RestTemplate restTemplate;
    private final String apiKey;

    RideMapsController(@Value("${app.maps.google-server-key:}") String apiKey) {
        this.apiKey = apiKey;
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(8));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    @GetMapping("/route")
    RouteInfo route(@RequestParam double originLat, @RequestParam double originLng,
                    @RequestParam double destinationLat, @RequestParam double destinationLng,
                    @RequestParam(defaultValue = "false") boolean avoidTolls) {
        var builder = UriComponentsBuilder.fromUriString(GOOGLE + "/directions/json")
                .queryParam("origin", originLat + "," + originLng)
                .queryParam("destination", destinationLat + "," + destinationLng)
                .queryParam("mode", "driving");
        if (avoidTolls) builder.queryParam("avoid", "tolls");
        var data = call(builder);
        var routes = (List<?>) data.get("routes");
        if (!"OK".equals(data.get("status")) || routes == null || routes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No route found");
        }
        var route = (Map<?, ?>) routes.get(0);
        var leg = (Map<?, ?>) ((List<?>) route.get("legs")).get(0);
        var meters = ((Number) ((Map<?, ?>) leg.get("distance")).get("value")).doubleValue();
        var seconds = ((Number) ((Map<?, ?>) leg.get("duration")).get("value")).doubleValue();
        var warnings = new ArrayList<String>();
        if (route.get("warnings") instanceof List<?> list) list.forEach(w -> warnings.add(String.valueOf(w)));
        var summary = route.get("summary") == null ? "" : route.get("summary").toString();
        var hasTolls = warnings.stream().anyMatch(w -> w.toLowerCase(Locale.ROOT).contains("toll"))
                || summary.toLowerCase(Locale.ROOT).contains("toll");
        var overview = (Map<?, ?>) route.get("overview_polyline");
        var polyline = overview == null || overview.get("points") == null ? "" : overview.get("points").toString();
        return new RouteInfo(polyline, Math.round(meters * 0.000621371 * 10) / 10.0, (int) Math.round(seconds / 60),
                hasTolls, warnings, summary);
    }

    @GetMapping("/autocomplete")
    List<Prediction> autocomplete(@RequestParam("q") String query) {
        if (query.isBlank() || query.length() > 200) return List.of();
        var data = call(UriComponentsBuilder.fromUriString(GOOGLE + "/place/autocomplete/json")
                .queryParam("input", query)
                .queryParam("components", "country:us")
                .queryParam("types", "geocode|establishment"));
        if (!(data.get("predictions") instanceof List<?> predictions)) return List.of();
        return predictions.stream().map(item -> {
            var p = (Map<?, ?>) item;
            var formatting = p.get("structured_formatting") instanceof Map<?, ?> f ? f : Map.of();
            return new Prediction(String.valueOf(p.get("description")), String.valueOf(p.get("place_id")),
                    formatting.get("main_text") == null ? null : formatting.get("main_text").toString(),
                    formatting.get("secondary_text") == null ? null : formatting.get("secondary_text").toString());
        }).toList();
    }

    @GetMapping("/geocode")
    LatLng geocode(@RequestParam String address) {
        if (address.isBlank() || address.length() > 300) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address is required");
        }
        var data = call(UriComponentsBuilder.fromUriString(GOOGLE + "/geocode/json").queryParam("address", address));
        if (!(data.get("results") instanceof List<?> results) || results.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found");
        }
        var location = (Map<?, ?>) ((Map<?, ?>) ((Map<?, ?>) results.get(0)).get("geometry")).get("location");
        return new LatLng(((Number) location.get("lat")).doubleValue(), ((Number) location.get("lng")).doubleValue());
    }

    private Map<?, ?> call(UriComponentsBuilder builder) {
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Maps provider is not configured");
        }
        URI uri = builder.queryParam("key", apiKey).encode().build().toUri();
        try {
            var body = restTemplate.getForObject(uri, Map.class);
            if (body == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Maps provider returned nothing");
            return body;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Maps provider unavailable", exception);
        }
    }
}
