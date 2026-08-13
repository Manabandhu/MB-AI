package com.manabandhu.backend.foundation;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class UnknownCatalogScreenException extends RuntimeException {
    public UnknownCatalogScreenException(String screenId) {
        super("Unknown catalog screen: " + screenId);
    }
}
