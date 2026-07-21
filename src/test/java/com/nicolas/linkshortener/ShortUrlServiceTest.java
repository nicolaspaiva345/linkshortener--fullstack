package com.nicolas.linkshortener;

import com.nicolas.linkshortener.entity.ShortUrl;
import com.nicolas.linkshortener.repository.ShortUrlRepository;
import com.nicolas.linkshortener.service.ShortUrlService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ShortUrlServiceTest {

    @Mock
    private ShortUrlRepository repository;

    @InjectMocks
    private ShortUrlService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void deveCriarShortUrlComSucesso() {
        String urlOriginal = "https://github.com";
        String customCode = "meu-link";

        when(repository.save(any(ShortUrl.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShortUrl resultado = service.shortenUrl(urlOriginal, customCode);

        assertNotNull(resultado);
        assertEquals(urlOriginal, resultado.getOriginalUrl());
        verify(repository, times(1)).save(any(ShortUrl.class));
    }

    @Test
    void deveBuscarEIncrementarCliquesComSucesso() {
        String code = "abcdefg";
        ShortUrl mockUrl = new ShortUrl();
        mockUrl.setShortCode(code);
        mockUrl.setOriginalUrl("https://google.com");
        mockUrl.setClicks(0L);

        when(repository.findByShortCode(code)).thenReturn(Optional.of(mockUrl));
        when(repository.save(any(ShortUrl.class))).thenReturn(mockUrl);

        Optional<ShortUrl> resultadoOpt = service.getOriginalUrlAndIncrementClicks(code);

        assertTrue(resultadoOpt.isPresent());
        ShortUrl resultado = resultadoOpt.get();
        assertEquals(1L, resultado.getClicks()); // Testando se o clique incrementou de 0 para 1
        verify(repository, times(1)).save(mockUrl);
    }
}