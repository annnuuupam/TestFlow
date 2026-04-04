package com.ots.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class AnswerRequest {
    @NotNull(message = "Question ID is required")
    private Long questionId;

    private List<Long> selectedOptionIds;
    private String textAnswer;
    private String codeLanguage;
    private Boolean markedForReview = false;
}
