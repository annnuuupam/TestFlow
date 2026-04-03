package com.ots.service;

import com.ots.dto.request.AnswerRequest;
import com.ots.dto.response.AttemptResponse;
import com.ots.entity.*;
import com.ots.enums.AttemptStatus;
import com.ots.enums.QuestionType;
import com.ots.exception.BadRequestException;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final TestAttemptRepository attemptRepository;
    private final AttemptAnswerRepository answerRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final QuestionRepository questionRepository;

    @Transactional
    public AttemptResponse startAttempt(Long examId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));

        // Check for in-progress attempt (resume)
        Optional<TestAttempt> existing = attemptRepository
                .findByExamIdAndUserIdAndStatus(examId, user.getId(), AttemptStatus.IN_PROGRESS);
        if (existing.isPresent()) {
            return buildAttemptResponse(existing.get(), exam, false);
        }

        // Check max attempts
        long completedCount = attemptRepository.findByUserIdOrderByStartTimeDesc(user.getId()).stream()
                .filter(a -> a.getExam().getId().equals(examId) && a.getStatus() == AttemptStatus.SUBMITTED)
                .count();
        if (completedCount >= exam.getMaxAttempts()) {
            throw new BadRequestException("Maximum attempts reached for this exam");
        }

        TestAttempt attempt = TestAttempt.builder()
                .exam(exam)
                .user(user)
                .status(AttemptStatus.IN_PROGRESS)
                .totalMarks(exam.getTotalMarks())
                .build();

        attemptRepository.save(attempt);
        return buildAttemptResponse(attempt, exam, false);
    }

    @Transactional
    public void saveAnswer(Long attemptId, AnswerRequest request, String username) {
        TestAttempt attempt = getAttemptForUser(attemptId, username);
        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question", request.getQuestionId()));

        AttemptAnswer answer = answerRepository
                .findByAttemptIdAndQuestionId(attemptId, request.getQuestionId())
                .orElse(AttemptAnswer.builder().attempt(attempt).question(question).build());

        if (request.getSelectedOptionIds() != null && !request.getSelectedOptionIds().isEmpty()) {
            answer.setSelectedOptionIds(request.getSelectedOptionIds().stream()
                    .map(String::valueOf).collect(Collectors.joining(",")));
        }
        if (request.getTextAnswer() != null) {
            answer.setTextAnswer(request.getTextAnswer());
        }
        if (request.getMarkedForReview() != null) {
            answer.setIsMarkedForReview(request.getMarkedForReview());
        }

        answerRepository.save(answer);
    }

    @Transactional
    public AttemptResponse submitAttempt(Long attemptId, String username) {
        TestAttempt attempt = getAttemptForUser(attemptId, username);
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Attempt is not in progress");
        }

        Exam exam = attempt.getExam();
        List<AttemptAnswer> answers = answerRepository.findByAttemptId(attemptId);
        List<Question> allQuestions = getAllExamQuestions(exam.getId());

        double totalScore = 0;
        int correct = 0, wrong = 0;

        for (AttemptAnswer ans : answers) {
            Question q = ans.getQuestion();
            boolean isCorrect = evaluateAnswer(ans, q);
            double marks = 0;

            if (isCorrect) {
                marks = q.getMarks();
                correct++;
            } else if (ans.getSelectedOptionIds() != null && !ans.getSelectedOptionIds().isBlank()) {
                wrong++;
                if (exam.getNegativeMarking()) {
                    marks = -(exam.getNegativeMarksPerWrong());
                }
            }

            ans.setIsCorrect(isCorrect);
            ans.setMarksObtained(marks);
            totalScore += marks;
            answerRepository.save(ans);
        }

        int unanswered = (int) allQuestions.stream()
                .filter(q -> answers.stream().noneMatch(a -> a.getQuestion().getId().equals(q.getId())))
                .count();

        long timeTaken = ChronoUnit.SECONDS.between(attempt.getStartTime(), LocalDateTime.now());
        double percentage = exam.getTotalMarks() > 0 ? (totalScore / exam.getTotalMarks()) * 100 : 0;

        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setEndTime(LocalDateTime.now());
        attempt.setScore(Math.max(0, totalScore));
        attempt.setCorrectCount(correct);
        attempt.setWrongCount(wrong);
        attempt.setUnansweredCount(unanswered);
        attempt.setPercentage(Math.max(0, percentage));
        attempt.setTimeTakenSeconds((int) timeTaken);

        attemptRepository.save(attempt);
        return buildAttemptResponse(attempt, exam, true);
    }

    public AttemptResponse getAttemptResult(Long attemptId, String username) {
        TestAttempt attempt = getAttemptForUser(attemptId, username);
        return buildAttemptResponse(attempt, attempt.getExam(), true);
    }

    public List<AttemptResponse> getUserAttempts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return attemptRepository.findByUserIdOrderByStartTimeDesc(user.getId()).stream()
                .map(a -> buildAttemptResponse(a, a.getExam(), false))
                .collect(Collectors.toList());
    }

    // ---- helpers ----

    private TestAttempt getAttemptForUser(Long attemptId, String username) {
        TestAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt", attemptId));
        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException("Attempt does not belong to current user");
        }
        return attempt;
    }

    private boolean evaluateAnswer(AttemptAnswer ans, Question q) {
        if (q.getQuestionType() == QuestionType.CODING) {
            // Text answers require manual grading – not auto-graded
            return false;
        }
        if (ans.getSelectedOptionIds() == null || ans.getSelectedOptionIds().isBlank()) return false;

        Set<Long> selectedIds = Arrays.stream(ans.getSelectedOptionIds().split(","))
                .map(String::trim).map(Long::parseLong).collect(Collectors.toSet());
        Set<Long> correctIds = q.getOptions().stream()
                .filter(Option::getIsCorrect).map(Option::getId).collect(Collectors.toSet());

        return selectedIds.equals(correctIds);
    }

    private List<Question> getAllExamQuestions(Long examId) {
        List<Section> sections = sectionRepository.findByExamIdOrderByDisplayOrder(examId);
        List<Question> all = new ArrayList<>();
        for (Section s : sections) {
            all.addAll(questionRepository.findBySectionIdOrderByDisplayOrder(s.getId()));
        }
        return all;
    }

    private AttemptResponse buildAttemptResponse(TestAttempt attempt, Exam exam, boolean includeDetails) {
        List<AttemptResponse.AnswerDetailResponse> details = new ArrayList<>();
        if (includeDetails && attempt.getStatus() == AttemptStatus.SUBMITTED) {
            List<AttemptAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
            for (AttemptAnswer ans : answers) {
                List<Long> selectedIds = new ArrayList<>();
                if (ans.getSelectedOptionIds() != null && !ans.getSelectedOptionIds().isBlank()) {
                    selectedIds = Arrays.stream(ans.getSelectedOptionIds().split(","))
                            .map(Long::parseLong).collect(Collectors.toList());
                }
                details.add(AttemptResponse.AnswerDetailResponse.builder()
                        .questionId(ans.getQuestion().getId())
                        .questionText(ans.getQuestion().getQuestionText())
                        .selectedOptionIds(selectedIds)
                        .textAnswer(ans.getTextAnswer())
                        .isCorrect(ans.getIsCorrect())
                        .marksObtained(ans.getMarksObtained())
                        .markedForReview(ans.getIsMarkedForReview())
                        .build());
            }
        }

        return AttemptResponse.builder()
                .id(attempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .userId(attempt.getUser().getId())
                .username(attempt.getUser().getUsername())
                .status(attempt.getStatus())
                .startTime(attempt.getStartTime())
                .endTime(attempt.getEndTime())
                .score(attempt.getScore())
                .totalMarks(attempt.getTotalMarks())
                .correctCount(attempt.getCorrectCount())
                .wrongCount(attempt.getWrongCount())
                .unansweredCount(attempt.getUnansweredCount())
                .percentage(attempt.getPercentage())
                .timeTakenSeconds(attempt.getTimeTakenSeconds())
                .passed(attempt.getPercentage() != null && attempt.getPercentage() >= exam.getPassingMarks())
                .answerDetails(includeDetails ? details : null)
                .build();
    }
}
