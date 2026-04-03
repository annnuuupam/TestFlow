package com.ots.dto.response;

import com.ots.enums.AttemptStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AttemptResponse {
    private Long id;
    private Long examId;
    private String examTitle;
    private Long userId;
    private String username;
    private AttemptStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double score;
    private Integer totalMarks;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer unansweredCount;
    private Double percentage;
    private Integer timeTakenSeconds;
    private Boolean passed;
    private List<AnswerDetailResponse> answerDetails;

    @Data
    @Builder
    public static class AnswerDetailResponse {
        private Long questionId;
        private String questionText;
        private List<Long> selectedOptionIds;
        private String textAnswer;
        private Boolean isCorrect;
        private Double marksObtained;
        private Boolean markedForReview;
    }
}
