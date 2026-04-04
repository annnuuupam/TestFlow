package com.ots.dto.external;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Judge0Request {
    private String source_code;
    private Integer language_id;
    private String stdin;
    private String expected_output;
    private Double cpu_time_limit;
    private Double memory_limit;
}
