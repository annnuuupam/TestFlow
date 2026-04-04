package com.ots.dto.request;

import com.ots.enums.SectionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SectionRequest {
    @NotBlank(message = "Section title is required")
    private String title;

    @NotNull(message = "Section type is required")
    private SectionType sectionType; // APTITUDE, MCQ, CODING, etc.

    @NotNull(message = "Marks per question is required")
    @Min(value = 1)
    @Builder.Default
    private Integer marksPerQuestion = 1;

    @Builder.Default
    private Integer displayOrder = 0;
}
