package com.ots.service;

import com.ots.dto.request.ExamRequest;
import com.ots.dto.response.ExamResponse;
import com.ots.dto.response.SectionResponse;
import com.ots.dto.response.QuestionResponse;
import com.ots.dto.response.TestCaseResponse;
import com.ots.entity.*;
import com.ots.enums.TestStatus;
import com.ots.exception.BadRequestException;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final SectionRepository sectionRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final TestAttemptRepository attemptRepository;

    public Page<ExamResponse> getAllExams(String search, Pageable pageable) {
        return examRepository.searchExams(search, pageable)
                .map(exam -> mapToResponse(exam, false));
    }

    public ExamResponse getExamById(Long id, boolean includeSections) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", id));
        return mapToResponse(exam, includeSections);
    }

    public List<ExamResponse> getActiveExams() {
        return examRepository.findCurrentlyActiveExams(LocalDateTime.now()).stream()
                .map(exam -> mapToResponse(exam, false))
                .collect(Collectors.toList());
    }

    public ExamResponse getExamForStudent(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", id));

        if (exam.getStatus() != TestStatus.ACTIVE) {
            throw new BadRequestException("Exam is not active");
        }

        LocalDateTime now = LocalDateTime.now();
        if (exam.getStartTime() != null && exam.getStartTime().isAfter(now)) {
            throw new BadRequestException("Exam has not started yet");
        }
        if (exam.getEndTime() != null && exam.getEndTime().isBefore(now)) {
            throw new BadRequestException("Exam has already ended");
        }

        return mapToResponse(exam, true);
    }

    @Transactional
    public ExamResponse createExam(ExamRequest request, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Exam exam = Exam.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .totalMarks(request.getTotalMarks())
                .passingMarks(request.getPassingMarks())
                .negativeMarking(request.getNegativeMarking())
                .negativeMarksPerWrong(request.getNegativeMarksPerWrong())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(request.getStatus() != null ? request.getStatus() : TestStatus.DRAFT)
                .isRandomized(request.getIsRandomized())
                .maxAttempts(request.getMaxAttempts())
                .createdBy(creator)
                .build();

        examRepository.save(exam);
        return mapToResponse(exam, true);
    }

    @Transactional
    public ExamResponse updateExam(Long id, ExamRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", id));

        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setTotalMarks(request.getTotalMarks());
        exam.setPassingMarks(request.getPassingMarks());
        exam.setNegativeMarking(request.getNegativeMarking());
        exam.setNegativeMarksPerWrong(request.getNegativeMarksPerWrong());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());
        if (request.getStatus() != null) exam.setStatus(request.getStatus());
        exam.setIsRandomized(request.getIsRandomized());
        exam.setMaxAttempts(request.getMaxAttempts());

        examRepository.save(exam);
        return mapToResponse(exam, true);
    }

    @Transactional
    public void toggleExamStatus(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", id));
        if (exam.getStatus() == TestStatus.ACTIVE) {
            exam.setStatus(TestStatus.DISABLED);
        } else if (exam.getStatus() == TestStatus.DISABLED || exam.getStatus() == TestStatus.DRAFT) {
            exam.setStatus(TestStatus.ACTIVE);
        }
        examRepository.save(exam);
    }

    @Transactional
    public void deleteExam(Long id) {
        if (!examRepository.existsById(id)) {
            throw new ResourceNotFoundException("Exam", id);
        }
        examRepository.deleteById(id);
    }

    public ExamResponse mapToResponse(Exam exam, boolean includeSections) {
        long attemptCount = attemptRepository.countByExamId(exam.getId());

        List<SectionResponse> sections = new ArrayList<>();
        int totalQuestions = 0;

        // Always compute totalQuestions (even when not including section details)
        List<Section> sectionList = sectionRepository.findByExamIdOrderByDisplayOrder(exam.getId());
        for (Section section : sectionList) {
            List<Question> questions = questionRepository.findBySectionIdOrderByDisplayOrder(section.getId());
            totalQuestions += questions.size();

            if (includeSections) {
                List<QuestionResponse> questionResponses = questions.stream()
                        .map(q -> mapQuestionToResponse(q, false))
                        .collect(Collectors.toList());

                sections.add(SectionResponse.builder()
                        .id(section.getId())
                        .title(section.getTitle())
                        .sectionType(section.getSectionType())
                        .marksPerQuestion(section.getMarksPerQuestion())
                        .displayOrder(section.getDisplayOrder())
                        .questionCount(questions.size())
                        .questions(questionResponses)
                        .build());
            }
        }

        return ExamResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .durationMinutes(exam.getDurationMinutes())
                .totalMarks(exam.getTotalMarks())
                .passingMarks(exam.getPassingMarks())
                .negativeMarking(exam.getNegativeMarking())
                .negativeMarksPerWrong(exam.getNegativeMarksPerWrong())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .status(exam.getStatus())
                .isRandomized(exam.getIsRandomized())
                .maxAttempts(exam.getMaxAttempts())
                .createdBy(exam.getCreatedBy() != null ? exam.getCreatedBy().getUsername() : null)
                .createdAt(exam.getCreatedAt())
                .totalQuestions(totalQuestions)
                .sectionCount(sectionList.size())
                .attemptCount(attemptCount)
                .sections(includeSections ? sections : null)
                .build();
    }

    public QuestionResponse mapQuestionToResponse(Question q, boolean includeAnswers) {
        List<QuestionResponse.OptionResponse> options = q.getOptions().stream()
                .map(opt -> QuestionResponse.OptionResponse.builder()
                        .id(opt.getId())
                        .optionText(opt.getOptionText())
                        .displayOrder(opt.getDisplayOrder())
                        .isCorrect(includeAnswers ? opt.getIsCorrect() : null)
                        .build())
                .collect(Collectors.toList());

        return QuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .marks(q.getMarks())
                .difficulty(q.getDifficulty())
                .displayOrder(q.getDisplayOrder())
                .options(options)
                .explanation(includeAnswers ? q.getExplanation() : null)
                .boilerplate(q.getBoilerplate())
                .constraints(q.getConstraints())
                .sampleInput(q.getSampleInput())
                .sampleOutput(q.getSampleOutput())
                .testCases(q.getTestCases().stream()
                        .filter(tc -> includeAnswers || !tc.getIsHidden()) // Show hidden only to admin/result view
                        .map(tc -> TestCaseResponse.builder()
                                .id(tc.getId())
                                .input(tc.getInput())
                                .expectedOutput(tc.getExpectedOutput())
                                .isHidden(tc.getIsHidden())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
