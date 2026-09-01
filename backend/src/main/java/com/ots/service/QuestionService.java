package com.ots.service;

import com.ots.dto.request.QuestionRequest;
import com.ots.dto.response.QuestionResponse;
import com.ots.entity.Option;
import com.ots.entity.Question;
import com.ots.entity.Section;
import com.ots.entity.TestCase;
import com.ots.enums.QuestionType;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.OptionRepository;
import com.ots.repository.QuestionRepository;
import com.ots.repository.SectionRepository;
import com.ots.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final SectionRepository sectionRepository;
    private final OptionRepository optionRepository;
    private final TestCaseRepository testCaseRepository;
    private final ExamService examService;

    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        Section section = null;
        if (request.getSectionId() != null) {
            section = sectionRepository.findById(request.getSectionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Section", request.getSectionId()));
        }

        Question question = Question.builder()
                .section(section)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .marks(request.getMarks())
                .explanation(request.getExplanation())
                .difficulty(request.getDifficulty())
                .displayOrder(request.getDisplayOrder())
                .boilerplate(request.getBoilerplate())
                .constraints(request.getConstraints())
                .sampleInput(request.getSampleInput())
                .sampleOutput(request.getSampleOutput())
                .build();

        questionRepository.save(question);

        if (request.getOptions() != null) {
            int order = 0;
            for (QuestionRequest.OptionRequest optReq : request.getOptions()) {
                Option option = Option.builder()
                        .question(question)
                        .optionText(optReq.getOptionText())
                        .isCorrect(optReq.getIsCorrect())
                        .displayOrder(order++)
                        .build();
                optionRepository.save(option);
                question.getOptions().add(option);
            }
        }

        if (request.getTestCases() != null) {
            for (QuestionRequest.TestCaseRequest tcReq : request.getTestCases()) {
                TestCase testCase = TestCase.builder()
                        .question(question)
                        .input(tcReq.getInput())
                        .expectedOutput(tcReq.getExpectedOutput())
                        .isHidden(tcReq.isHidden())
                        .build();
                testCaseRepository.save(testCase);
                question.getTestCases().add(testCase);
            }
        }

        if (section != null) {
            examService.recalculateTotalMarks(section.getExam().getId());
        }

        return examService.mapQuestionToResponse(question, true);
    }

    public List<QuestionResponse> getAllBankQuestions() {
        return questionRepository.findBySectionIsNullOrderByIdDesc().stream()
                .map(q -> examService.mapQuestionToResponse(q, true))
                .collect(Collectors.toList());
    }

    public QuestionResponse getBankQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
        if (question.getSection() != null) {
            throw new ResourceNotFoundException("Question", id);
        }
        return examService.mapQuestionToResponse(question, true);
    }

    /**
     * Clone one or more question-bank questions into an exam section.
     * The source questions are copied so later bank edits never affect existing exams.
     */
    @Transactional
    public List<QuestionResponse> importFromBank(Long sectionId, List<Long> questionIds, Integer marks) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));

        int startOrder = questionRepository.findBySectionIdOrderByDisplayOrder(sectionId).size();
        List<QuestionResponse> created = new java.util.ArrayList<>();
        int order = startOrder;

        for (Long qId : questionIds) {
            Question source = questionRepository.findById(qId)
                    .orElseThrow(() -> new ResourceNotFoundException("Question", qId));

            Question copy = Question.builder()
                    .section(section)
                    .questionText(source.getQuestionText())
                    .questionType(source.getQuestionType())
                    .marks(marks != null ? marks : source.getMarks())
                    .explanation(source.getExplanation())
                    .difficulty(source.getDifficulty())
                    .displayOrder(order++)
                    .boilerplate(source.getBoilerplate())
                    .constraints(source.getConstraints())
                    .sampleInput(source.getSampleInput())
                    .sampleOutput(source.getSampleOutput())
                    .build();
            questionRepository.save(copy);

            if (source.getOptions() != null) {
                int optOrder = 0;
                for (Option opt : source.getOptions()) {
                    Option optionCopy = Option.builder()
                            .question(copy)
                            .optionText(opt.getOptionText())
                            .isCorrect(opt.getIsCorrect())
                            .displayOrder(optOrder++)
                            .build();
                    optionRepository.save(optionCopy);
                    copy.getOptions().add(optionCopy);
                }
            }

            if (source.getTestCases() != null) {
                for (TestCase tc : source.getTestCases()) {
                    TestCase tcCopy = TestCase.builder()
                            .question(copy)
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .isHidden(tc.getIsHidden())
                            .build();
                    testCaseRepository.save(tcCopy);
                    copy.getTestCases().add(tcCopy);
                }
            }

            created.add(examService.mapQuestionToResponse(copy, true));
        }

        examService.recalculateTotalMarks(section.getExam().getId());
        return created;
    }

    @Transactional
    public QuestionResponse updateQuestion(Long id, QuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));

        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setMarks(request.getMarks());
        question.setExplanation(request.getExplanation());
        question.setDifficulty(request.getDifficulty());
        question.setBoilerplate(request.getBoilerplate());
        question.setConstraints(request.getConstraints());
        question.setSampleInput(request.getSampleInput());
        question.setSampleOutput(request.getSampleOutput());

        // Re-create options
        optionRepository.deleteByQuestionId(id);
        question.getOptions().clear();

        if (request.getOptions() != null) {
            int order = 0;
            for (QuestionRequest.OptionRequest optReq : request.getOptions()) {
                Option option = Option.builder()
                        .question(question)
                        .optionText(optReq.getOptionText())
                        .isCorrect(optReq.getIsCorrect())
                        .displayOrder(order++)
                        .build();
                optionRepository.save(option);
                question.getOptions().add(option);
            }
        }

        // Re-create test cases
        testCaseRepository.deleteByQuestionId(id);
        question.getTestCases().clear();
        if (request.getTestCases() != null) {
            for (QuestionRequest.TestCaseRequest tcReq : request.getTestCases()) {
                TestCase testCase = TestCase.builder()
                        .question(question)
                        .input(tcReq.getInput())
                        .expectedOutput(tcReq.getExpectedOutput())
                        .isHidden(tcReq.isHidden())
                        .build();
                testCaseRepository.save(testCase);
                question.getTestCases().add(testCase);
            }
        }

        questionRepository.save(question);
        if (question.getSection() != null) {
            examService.recalculateTotalMarks(question.getSection().getExam().getId());
        }
        return examService.mapQuestionToResponse(question, true);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));

        Long examId = (question.getSection() != null) ? question.getSection().getExam().getId() : null;

        questionRepository.deleteById(id);
        // flush the removal before recalculating so the cascading merge in
        // recalculateTotalMarks never sees the deleted question instance
        questionRepository.flush();

        if (examId != null) {
            examService.recalculateTotalMarks(examId);
        }
    }

    /**
     * Bulk import questions from CSV.
     * CSV format: sectionId,questionText,questionType,marks,difficulty,option1,option2,option3,option4,correctOptions(comma-sep indices 0-based)
     */
    @Transactional
    public int bulkImportFromCsv(MultipartFile file) {
        int count = 0;
        var touchedSections = new java.util.LinkedHashSet<Long>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build())) {

            for (CSVRecord record : csvParser) {
                Long sectionId = Long.parseLong(record.get("sectionId"));
                touchedSections.add(sectionId);
                String questionText = record.get("questionText");
                QuestionType type = QuestionType.valueOf(record.get("questionType").toUpperCase());
                int marks = Integer.parseInt(record.get("marks"));
                String difficulty = record.get("difficulty");

                Section section = sectionRepository.findById(sectionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));

                Question question = Question.builder()
                        .section(section)
                        .questionText(questionText)
                        .questionType(type)
                        .marks(marks)
                        .difficulty(difficulty)
                        .displayOrder(count)
                        .build();
                questionRepository.save(question);

                // Parse options (opt1..opt4)
                List<String> optTexts = List.of(
                        record.get("option1"), record.get("option2"),
                        record.get("option3"), record.get("option4")
                );

                String correctStr = record.get("correctOptions"); // e.g. "0" or "0,2"
                List<Integer> correctIndices = Arrays.stream(correctStr.split(","))
                        .map(String::trim)
                        .map(Integer::parseInt)
                        .collect(Collectors.toList());

                for (int i = 0; i < optTexts.size(); i++) {
                    String text = optTexts.get(i);
                    if (text != null && !text.isBlank()) {
                        Option opt = Option.builder()
                                .question(question)
                                .optionText(text)
                                .isCorrect(correctIndices.contains(i))
                                .displayOrder(i)
                                .build();
                        optionRepository.save(opt);
                    }
                }
                count++;
            }
            // Keep affected exams' total marks in sync
            for (Long sectionId : touchedSections) {
                Section sec = sectionRepository.findById(sectionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
                examService.recalculateTotalMarks(sec.getExam().getId());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV: " + e.getMessage(), e);
        }
        return count;
    }
}
