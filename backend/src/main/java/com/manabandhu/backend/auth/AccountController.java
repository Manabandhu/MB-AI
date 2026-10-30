package com.manabandhu.backend.auth;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class AccountController {

    private final AccountService accountService;

    AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    /** Download of everything stored against the caller. */
    @GetMapping("/export")
    ResponseEntity<Map<String, Object>> export(Authentication authentication) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"manabandhu-data.json\"")
                .body(accountService.export(Actor.require(authentication)));
    }

    /** Deletes the caller's account; requires a sign-in within the last 10 minutes (401 reauth_required otherwise). */
    @DeleteMapping
    ResponseEntity<Void> delete(Authentication authentication) {
        accountService.delete(Actor.require(authentication), RecentSignIn.of(authentication), Instant.now());
        return ResponseEntity.noContent().build();
    }
}
