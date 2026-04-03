package com.ots.dto.response;

import com.ots.enums.SectionType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SectionResponse {
    private Long id;
    private String title;
    private SectionType sectionType;
    private Integer marksPerQuestion;
    private Integer displayOrder;
    private Integer questionCount;
    private List<QuestionResponse> questions;
}
