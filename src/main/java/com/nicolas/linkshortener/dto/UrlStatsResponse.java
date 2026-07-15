package com.nicolas.linkshortener.dto;

import java.time.LocalDateTime;

public record UrlStatsResponse(
        String originalUrl,
        Long clicks,
        LocalDateTime createdAt
) {}