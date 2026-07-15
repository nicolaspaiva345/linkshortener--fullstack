package com.nicolas.linkshortener.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record CreateShortUrlRequest(
        @NotBlank(message = "A URL original não pode estar em branco")
        @URL(message = "URL inválida")
        String originalUrl,

        String customAlias
) {}