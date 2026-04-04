package com.ots.dto.external;

import lombok.Data;

@Data
public class Judge0Response {
    private String token;
    private String stdout;
    private String stderr;
    private String compile_output;
    private String message;
    private Integer status_id;
    private Status status;
    private Double time;
    private Integer memory;

    @Data
    public static class Status {
        private Integer id;
        private String description;
    }
}
