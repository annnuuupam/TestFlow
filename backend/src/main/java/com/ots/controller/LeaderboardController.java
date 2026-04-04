package com.ots.controller;

import com.ots.dto.response.LeaderboardEntry;
import com.ots.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "Test leaderboard endpoints")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/{examId}")
    @Operation(summary = "Get ranked leaderboard for a specific exam")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard(@PathVariable Long examId) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(examId));
    }

    @GetMapping("/global")
    @Operation(summary = "Get ranked leaderboard for all exams")
    public ResponseEntity<List<LeaderboardEntry>> getGlobalLeaderboard() {
        return ResponseEntity.ok(leaderboardService.getGlobalLeaderboard());
    }
}
