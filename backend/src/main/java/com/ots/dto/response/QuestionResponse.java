package com.ots.dto.response;

import com.ots.enums.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuestionResponse {
    private Long id;
    private String questionText;
    private QuestionType questionType;
    private Integer marks;
    private String difficulty;
    private Integer displayOrder;
    private List<OptionResponse> options;
    // explanation only included in result view (not during exam)
    private String explanation;

    @Data
    @Builder
    public static class OptionResponse {
        private Long id;
        private String optionText;
        private Integer displayOrder;
        // isCorrect is excluded from exam view; only in result view
        private Boolean isCorrect;
    }
}
