package com.ots.controller;

import com.ots.dto.response.AnalyticsResponse;
import com.ots.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Analytics", description = "Admin dashboard analytics endpoints")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    @Operation(summary = "Get admin dashboard overview stats")
    public ResponseEntity<AnalyticsResponse> getOverview() {
        return ResponseEntity.ok(analyticsService.getOverview());
    }
}
