package com.ots.controller;

import com.ots.dto.response.ExamResponse;
import com.ots.service.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
@Tag(name = "Tests", description = "Student-facing test endpoints")
public class TestController {

    private final ExamService examService;

    @GetMapping
    @Operation(summary = "Get all active tests available to students")
    public ResponseEntity<List<ExamResponse>> getActiveTests() {
        return ResponseEntity.ok(examService.getActiveExams());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get test details (sections + questions, WITHOUT correct answers)")
    public ResponseEntity<ExamResponse> getTestDetails(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamById(id, true));
    }
}
