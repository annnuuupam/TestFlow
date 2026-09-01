package com.ots.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportFromBankRequest {
    @NotNull(message = "Section ID is required")
    private Long sectionId;

    @NotEmpty(message = "Select at least one question")
    private List<Long> questionIds;

    // Optional override; when null each bank question keeps its own marks
    private Integer marks;
}