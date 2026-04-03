package com.ots.controller;

import com.ots.dto.request.AnswerRequest;
import com.ots.dto.response.AttemptResponse;
import com.ots.service.AttemptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Attempts", description = "Student test attempt endpoints")
public class AttemptController {

    private final AttemptService attemptService;

    @PostMapping("/api/tests/{examId}/attempt")
    @Operation(summary = "Start or resume a test attempt")
    public ResponseEntity<AttemptResponse> startAttempt(@PathVariable Long examId,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attemptService.startAttempt(examId, userDetails.getUsername()));
    }

    @PutMapping("/api/attempts/{attemptId}/answer")
    @Operation(summary = "Save or update an answer for a question")
    public ResponseEntity<Void> saveAnswer(@PathVariable Long attemptId,
                                            @RequestBody AnswerRequest request,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        attemptService.saveAnswer(attemptId, request, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/attempts/{attemptId}/submit")
    @Operation(summary = "Submit the test attempt for grading")
    public ResponseEntity<AttemptResponse> submitAttempt(@PathVariable Long attemptId,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(attemptService.submitAttempt(attemptId, userDetails.getUsername()));
    }

    @GetMapping("/api/attempts/{attemptId}/result")
    @Operation(summary = "Get detailed result for a completed attempt")
    public ResponseEntity<AttemptResponse> getResult(@PathVariable Long attemptId,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(attemptService.getAttemptResult(attemptId, userDetails.getUsername()));
    }

    @GetMapping("/api/attempts/me")
    @Operation(summary = "Get all attempts of the current student")
    public ResponseEntity<List<AttemptResponse>> getMyAttempts(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(attemptService.getUserAttempts(userDetails.getUsername()));
    }
}
