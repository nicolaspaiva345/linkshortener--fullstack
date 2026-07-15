package com.nicolas.linkshortener.service;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.nicolas.linkshortener.entity.ShortUrl;
import com.nicolas.linkshortener.repository.ShortUrlRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class ShortUrlService {

    private final ShortUrlRepository repository;

    private final RedisTemplate<String, String> redisTemplate;

    private static final String REDIS_PREFIX = "shorturl:";

    public ShortUrlService(ShortUrlRepository repository, RedisTemplate<String, String> redisTemplate) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
    }

    public ShortUrl shortenUrl(String originalUrl, String customAlias) {
        String shortCode;

        if (customAlias != null && !customAlias.trim().isEmpty()) {
            String cleanAlias = customAlias.trim().replaceAll("[^a-zA-Z0-9-_]", "");

            if (cleanAlias.isEmpty()) {
                throw new IllegalArgumentException("O link personalizado contém caracteres inválidos.");
            }

            if (Boolean.TRUE.equals(redisTemplate.hasKey(REDIS_PREFIX + cleanAlias)) ||
                    repository.findByShortCode(cleanAlias).isPresent()) {
                throw new IllegalArgumentException("Este link personalizado já está em uso. Escolha outro!");
            }

            shortCode = cleanAlias;
        } else {
            shortCode = NanoIdUtils.randomNanoId(
                    NanoIdUtils.DEFAULT_NUMBER_GENERATOR,
                    NanoIdUtils.DEFAULT_ALPHABET,
                    7
            );
        }

        ShortUrl shortUrl = new ShortUrl();
        shortUrl.setOriginalUrl(originalUrl);
        shortUrl.setShortCode(shortCode);
        shortUrl.setClicks(0L);

        ShortUrl saved = repository.save(shortUrl);

        redisTemplate.opsForValue().set(REDIS_PREFIX + shortCode, originalUrl, 24, TimeUnit.HOURS);

        return saved;
    }

    public Optional<ShortUrl> getOriginalUrlAndIncrementClicks(String shortCode) {
        String redisKey = REDIS_PREFIX + shortCode;
        String cachedOriginalUrl = null;

        try {
            cachedOriginalUrl = redisTemplate.opsForValue().get(redisKey);
        } catch (Exception e) {
            System.err.println("Falha ao ler do Redis: " + e.getMessage());
        }

        if (cachedOriginalUrl != null) {
            ShortUrl shortUrl = new ShortUrl();
            shortUrl.setShortCode(shortCode);
            shortUrl.setOriginalUrl(cachedOriginalUrl);

            try {
                repository.findByShortCode(shortCode).ifPresent(url -> {
                    url.setClicks(url.getClicks() + 1);
                    repository.save(url);
                });
            } catch (Exception e) {
                System.err.println("Erro ao incrementar cliques no banco: " + e.getMessage());
            }

            return Optional.of(shortUrl);
        }

        Optional<ShortUrl> shortUrlOpt = repository.findByShortCode(shortCode);

        shortUrlOpt.ifPresent(url -> {
            url.setClicks(url.getClicks() + 1);
            repository.save(url);

            redisTemplate.opsForValue().set(redisKey, url.getOriginalUrl(), 24, TimeUnit.HOURS);
        });

        return shortUrlOpt;
    }

    public void deleteUrl(String shortCode) {
        ShortUrl url = repository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Link não encontrado."));

        repository.delete(url);

        try {
            redisTemplate.delete(REDIS_PREFIX + shortCode);
        } catch (Exception e) {
            System.err.println("Erro ao remover cache do Redis: " + e.getMessage());
        }
    }

    public Optional<ShortUrl> getStatsByShortCode(String shortCode) {
        return repository.findByShortCode(shortCode);
    }
}