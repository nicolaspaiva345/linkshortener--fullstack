package com.nicolas.linkshortener.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "link_analytics")
public class LinkAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    private String deviceType;
    private String referrer;

    private LocalDateTime clickedAt;

    public LinkAnalytics() {}

    public LinkAnalytics(String code, String deviceType, String referrer, LocalDateTime clickedAt) {
        this.code = code;
        this.deviceType = deviceType;
        this.referrer = referrer;
        this.clickedAt = clickedAt;
    }

}