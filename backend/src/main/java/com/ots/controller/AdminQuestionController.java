package com.ots.controller;

import com.ots.dto.request.ImportFromBankRequest;
import com.ots.dto.request.QuestionRequest;
import com.ots.dto.response.QuestionResponse;
import com.ots.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Questions", description = "Admin question management endpoints")
public class AdminQuestionController {

    private final QuestionService questionService;

    @PostMapping
    @Operation(summary = "Create a new question (omit sectionId to add it to the question bank)")
    public ResponseEntity<QuestionResponse> createQuestion(@Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestion(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a question and its options")
    public ResponseEntity<QuestionResponse> updateQuestion(@PathVariable Long id,
                                                            @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a question")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/question-bank")
    @Operation(summary = "List all questions in the reusable question bank")
    public ResponseEntity<List<QuestionResponse>> getQuestionBank() {
        return ResponseEntity.ok(questionService.getAllBankQuestions());
    }

    @GetMapping("/question-bank/{id}")
    @Operation(summary = "Get a single question-bank question")
    public ResponseEntity<QuestionResponse> getBankQuestion(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getBankQuestion(id));
    }

    @PostMapping("/import-to-section")
    @Operation(summary = "Clone selected question-bank questions into an exam section")
    public ResponseEntity<List<QuestionResponse>> importFromBank(@Valid @RequestBody ImportFromBankRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(questionService.importFromBank(request.getSectionId(), request.getQuestionIds(), request.getMarks()));
    }

    @PostMapping("/bulk")
    @Operation(summary = "Bulk import questions from CSV file",
               description = "CSV columns: sectionId, questionText, questionType, marks, difficulty, option1, option2, option3, option4, correctOptions")
    public ResponseEntity<Map<String, Object>> bulkImport(@RequestParam("file") MultipartFile file) {
        int count = questionService.bulkImportFromCsv(file);
        return ResponseEntity.ok(Map.of("message", "Successfully imported " + count + " questions", "count", count));
    }
}
