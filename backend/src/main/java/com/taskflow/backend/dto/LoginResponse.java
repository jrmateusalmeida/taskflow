
package com.taskflow.backend.dto;

public record LoginResponse(
    String token,
    String tokenType,
    Long userId,
    String name,
    String email
) {}
