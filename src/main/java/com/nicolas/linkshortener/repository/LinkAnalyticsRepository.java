package com.nicolas.linkshortener.repository;

import com.nicolas.linkshortener.entity.LinkAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Map;

public interface LinkAnalyticsRepository extends JpaRepository<LinkAnalytics, Long> {

    long countByCode(String code);

    @Query("SELECT a.deviceType as type, COUNT(a) as count FROM LinkAnalytics a WHERE a.code = :code GROUP BY a.deviceType")
    List<Map<String, Object>> getDeviceStats(@Param("code") String code);

    @Query("SELECT a.referrer as source, COUNT(a) as count FROM LinkAnalytics a WHERE a.code = :code GROUP BY a.referrer")
    List<Map<String, Object>> getReferrerStats(@Param("code") String code);
}