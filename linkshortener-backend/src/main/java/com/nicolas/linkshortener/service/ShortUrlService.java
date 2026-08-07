package com.nicolas.linkshortener.service;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.nicolas.linkshortener.entity.ShortUrl;
import com.nicolas.linkshortener.repository.ShortUrlRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ShortUrlService {

    private final ShortUrlRepository repository;

    public ShortUrlService(ShortUrlRepository repository) {
        this.repository = repository;
    }

    public ShortUrl shortenUrl(String originalUrl, String customAlias) {
        String shortCode;

        if (customAlias != null && !customAlias.trim().isEmpty()) {
            String cleanAlias = customAlias.trim().replaceAll("[^a-zA-Z0-9-_]", "");

            if (cleanAlias.isEmpty()) {
                throw new IllegalArgumentException("O link personalizado contém caracteres inválidos.");
            }

            if (repository.findByShortCode(cleanAlias).isPresent()) {
                throw new IllegalArgumentException("Este link personalizado já está em uso. Escolha outro!");
            }

            shortCode = cleanAlias;
        } else {
            shortCode = generateUniqueShortCode();
        }

        ShortUrl shortUrl = new ShortUrl();
        shortUrl.setOriginalUrl(originalUrl);
        shortUrl.setShortCode(shortCode);
        shortUrl.setClicks(0L);

        return repository.save(shortUrl);
    }

    public Optional<ShortUrl> getOriginalUrlAndIncrementClicks(String shortCode) {
        Optional<ShortUrl> shortUrlOpt = repository.findByShortCode(shortCode);

        shortUrlOpt.ifPresent(url -> {
            url.setClicks(url.getClicks() + 1);
            repository.save(url);
        });

        return shortUrlOpt;
    }

    public void deleteUrl(String shortCode) {
        ShortUrl url = repository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Link não encontrado."));

        repository.delete(url);
    }

    public Optional<ShortUrl> getStatsByShortCode(String shortCode) {
        return repository.findByShortCode(shortCode);
    }

    // Método auxiliar para garantir que o NanoID gerado não colida com nenhum código existente no banco
    private String generateUniqueShortCode() {
        String code;
        do {
            code = NanoIdUtils.randomNanoId(
                    NanoIdUtils.DEFAULT_NUMBER_GENERATOR,
                    NanoIdUtils.DEFAULT_ALPHABET,
                    7
            );
        } while (repository.findByShortCode(code).isPresent());
        return code;
    }
}