package com.eventpulse.exception;

/**
 * Exception thrown when an entity creation conflicts with an existing resource
 * or violates a uniqueness constraint.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String message, Throwable cause) {
        super(message, cause);
    }
}
