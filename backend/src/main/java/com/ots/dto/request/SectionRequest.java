package com.ots.dto.request;

import com.ots.enums.SectionType;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class SectionRequest {
    @NotBlank(message = "Section title is required")
    private String title;

    @NotNull
    private SectionType sectionType = SectionType.MCQ;

    private Integer marksPerQuestion = 1;
    private Integer displayOrder = 0;
}
