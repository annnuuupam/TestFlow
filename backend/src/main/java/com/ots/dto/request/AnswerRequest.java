package com.ots.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class AnswerRequest {
    private Long questionId;
    private List<Long> selectedOptionIds;  // For MCQ / MULTI_SELECT
    private String textAnswer;             // For CODING questions
    private Boolean markedForReview = false;
}
