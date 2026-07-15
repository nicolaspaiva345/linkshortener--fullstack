package com.nicolas.linkshortener.controller;

import com.nicolas.linkshortener.dto.CreateShortUrlRequest;
import com.nicolas.linkshortener.dto.ShortUrlResponse;
import com.nicolas.linkshortener.dto.UrlStatsResponse;
import com.nicolas.linkshortener.entity.ShortUrl;
import com.nicolas.linkshortener.entity.LinkAnalytics;
import com.nicolas.linkshortener.repository.LinkAnalyticsRepository;
import com.nicolas.linkshortener.service.ShortUrlService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/urls")
// Adicionado os métodos explícitos no CORS para garantir que o DELETE e OPTIONS passem
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ShortUrlController {

    private final ShortUrlService service;
    private final LinkAnalyticsRepository analyticsRepository;

    public ShortUrlController(ShortUrlService service, LinkAnalyticsRepository analyticsRepository) {
        this.service = service;
        this.analyticsRepository = analyticsRepository;
    }

    @PostMapping
    public ResponseEntity<Object> create(@Valid @RequestBody CreateShortUrlRequest request) {
        try {
            ShortUrl created = service.shortenUrl(request.originalUrl(), request.customAlias());
            String shortUrl = "http://localhost:8080/api/urls/" + created.getShortCode();
            return ResponseEntity.ok(new ShortUrlResponse(shortUrl));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new com.nicolas.linkshortener.dto.ErrorResponse(
                    e.getMessage(),
                    400,
                    LocalDateTime.now()
            ));
        }
    }

    @GetMapping("/{shortCode}")
    public ResponseEntity<Object> redirect(
            @PathVariable String shortCode,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @RequestHeader(value = "Referer", required = false) String referer) {

        if ("favicon.ico".equals(shortCode)) {
            return ResponseEntity.notFound().build();
        }

        return service.getOriginalUrlAndIncrementClicks(shortCode)
                .map(url -> {
                    try {
                        String device = parseDevice(userAgent);
                        String source = parseReferrer(referer);

                        LinkAnalytics click = new LinkAnalytics(shortCode, device, source, LocalDateTime.now());
                        analyticsRepository.save(click);
                    } catch (Exception e) {
                        System.err.println("Erro ao salvar métricas: " + e.getMessage());
                    }

                    // CORREÇÃO 1: Retornando um JSON (200 OK) em vez de 302 Redirect.
                    // Isso permite que o React pegue a URL e faça o redirecionamento com a tela de "Link Seguro"
                    Map<String, String> response = new HashMap<>();
                    response.put("originalUrl", url.getOriginalUrl());
                    return ResponseEntity.ok((Object) response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{shortCode}")
    public ResponseEntity<Void> deleteUrl(@PathVariable String shortCode) {
        try {
            service.deleteUrl(shortCode);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats/{shortCode}")
    public ResponseEntity<UrlStatsResponse> getStats(@PathVariable String shortCode) {
        return service.getStatsByShortCode(shortCode)
                .map(url -> ResponseEntity.ok(new UrlStatsResponse(
                        url.getOriginalUrl(),
                        url.getClicks(),
                        url.getCreatedAt()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/analytics/{shortCode}")
    public ResponseEntity<Map<String, Object>> getDetailedAnalytics(@PathVariable String shortCode) {
        long totalClicks = analyticsRepository.countByCode(shortCode);

        List<Map<String, Object>> devices = analyticsRepository.getDeviceStats(shortCode);
        List<Map<String, Object>> referrers = analyticsRepository.getReferrerStats(shortCode);

        Map<String, Object> response = new HashMap<>();
        response.put("code", shortCode);
        response.put("totalClicks", totalClicks);
        response.put("devices", devices);
        response.put("referrers", referrers);

        return ResponseEntity.ok(response);
    }

    private String parseDevice(String userAgent) {
        if (userAgent == null) return "Desktop";
        String ua = userAgent.toLowerCase();
        if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone") || ua.contains("ipad")) {
            return "Mobile";
        }
        return "Desktop";
    }

    private String parseReferrer(String referer) {
        if (referer == null || referer.trim().isEmpty()) {
            return "WhatsApp / Direct";
        }
        String ref = referer.toLowerCase();
        if (ref.contains("instagram")) {
            return "Instagram";
        } else if (ref.contains("tiktok")) {
            return "TikTok";
        } else if (ref.contains("facebook") || ref.contains("fb")) {
            return "Facebook";
        } else if (ref.contains("t.co") || ref.contains("twitter") || ref.contains("x.com")) {
            return "Twitter/X";
        }
        return "Outros";
    }
}