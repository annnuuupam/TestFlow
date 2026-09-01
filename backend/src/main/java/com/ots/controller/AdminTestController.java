package com.ots.controller;

import com.ots.dto.request.ExamRequest;
import com.ots.dto.request.SectionRequest;
import com.ots.dto.response.ExamResponse;
import com.ots.dto.response.SectionResponse;
import com.ots.entity.Exam;
import com.ots.entity.Section;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.ExamRepository;
import com.ots.repository.SectionRepository;
import com.ots.service.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/tests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Tests", description = "Admin exam management endpoints")
public class AdminTestController {

    private final ExamService examService;
    private final ExamRepository examRepository;
    private final SectionRepository sectionRepository;

    @GetMapping
    @Operation(summary = "List all tests with pagination")
    public ResponseEntity<Page<ExamResponse>> getAllTests(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(examService.getAllExams(search,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get test details with sections and questions")
    public ResponseEntity<ExamResponse> getTest(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamById(id, true));
    }

    @PostMapping
    @Operation(summary = "Create a new test")
    public ResponseEntity<ExamResponse> createTest(@Valid @RequestBody ExamRequest request,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examService.createExam(request, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing test")
    public ResponseEntity<ExamResponse> updateTest(@PathVariable Long id,
                                                    @Valid @RequestBody ExamRequest request) {
        return ResponseEntity.ok(examService.updateExam(id, request));
    }

    @PutMapping("/{id}/toggle")
    @Operation(summary = "Toggle test active/disabled status")
    public ResponseEntity<Void> toggleTest(@PathVariable Long id) {
        examService.toggleExamStatus(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a test")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        examService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{examId}/sections")
    @Operation(summary = "Add a section to a test")
    public ResponseEntity<SectionResponse> addSection(@PathVariable Long examId,
                                                       @Valid @RequestBody SectionRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));

        Section section = Section.builder()
                .exam(exam)
                .title(request.getTitle())
                .sectionType(request.getSectionType())
                .marksPerQuestion(request.getMarksPerQuestion())
                .displayOrder(request.getDisplayOrder())
                .build();

        sectionRepository.save(section);
        return ResponseEntity.status(HttpStatus.CREATED).body(SectionResponse.builder()
                .id(section.getId())
                .title(section.getTitle())
                .sectionType(section.getSectionType())
                .marksPerQuestion(section.getMarksPerQuestion())
                .displayOrder(section.getDisplayOrder())
                .questionCount(0)
                .build());
    }

    @DeleteMapping("/sections/{sectionId}")
    @Operation(summary = "Delete a section (and all its questions)")
    public ResponseEntity<Void> deleteSection(@PathVariable Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
        Long examId = section.getExam().getId();
        sectionRepository.deleteById(sectionId);
        // flush the removal before recalculating so the cascading merge never sees the deleted section
        sectionRepository.flush();
        examService.recalculateTotalMarks(examId);
        return ResponseEntity.noContent().build();
    }
}
