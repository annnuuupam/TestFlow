package com.ots.service;

import com.ots.dto.request.QuestionRequest;
import com.ots.dto.response.QuestionResponse;
import com.ots.entity.Option;
import com.ots.entity.Question;
import com.ots.entity.Section;
import com.ots.enums.QuestionType;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.OptionRepository;
import com.ots.repository.QuestionRepository;
import com.ots.repository.SectionRepository;
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
    private final ExamService examService;

    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Section", request.getSectionId()));

        Question question = Question.builder()
                .section(section)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .marks(request.getMarks())
                .explanation(request.getExplanation())
                .difficulty(request.getDifficulty())
                .displayOrder(request.getDisplayOrder())
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

        return examService.mapQuestionToResponse(question, true);
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

        questionRepository.save(question);
        return examService.mapQuestionToResponse(question, true);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Question", id);
        }
        questionRepository.deleteById(id);
    }

    /**
     * Bulk import questions from CSV.
     * CSV format: sectionId,questionText,questionType,marks,difficulty,option1,option2,option3,option4,correctOptions(comma-sep indices 0-based)
     */
    @Transactional
    public int bulkImportFromCsv(MultipartFile file) {
        int count = 0;
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
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV: " + e.getMessage(), e);
        }
        return count;
    }
}
