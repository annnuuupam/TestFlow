package com.ots.service.executor;

import com.ots.dto.external.Judge0Request;
import com.ots.dto.external.Judge0Response;
import com.ots.dto.request.CodeRunRequest;
import com.ots.dto.response.CodeRunResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * Production-grade Judge0 API executor.
 * Provides isolated, sandboxed execution.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class Judge0Executor implements CodeExecutor {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.judge0.api-url:https://judge0-ce.p.rapidapi.com}")
    private String apiUrl;

    @Value("${app.judge0.api-key:}")
    private String apiKey;

    @Override
    public CodeRunResponse execute(String code, String language, List<CodeRunRequest.TestCaseInput> testCases) {
        if (testCases == null || testCases.isEmpty()) {
            return CodeRunResponse.builder().totalTests(0).passed(0).failed(0).allPassed(true).build();
        }

        int passed = 0;
        List<CodeRunResponse.TestCaseResult> results = new ArrayList<>();
        String compileError = null;

        for (int i = 0; i < testCases.size(); i++) {
            CodeRunRequest.TestCaseInput tc = testCases.get(i);
            try {
                Judge0Response res = submitToJudge0(code, language, tc);
                
                // Status 3 = Accepted
                boolean casePassed = res.getStatus_id() != null && res.getStatus_id() == 3;
                if (casePassed) passed++;

                results.add(CodeRunResponse.TestCaseResult.builder()
                        .index(i + 1)
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .actualOutput(res.getStdout())
                        .passed(casePassed)
                        .error(res.getStderr() != null ? res.getStderr() : res.getCompile_output())
                        .executionTimeMs(res.getTime() != null ? (long)(res.getTime() * 1000) : 0L)
                        .build());
                
                if (res.getStatus_id() != null && res.getStatus_id() == 6) { // Compilation Error
                    compileError = res.getCompile_output();
                }

            } catch (Exception e) {
                log.error("Judge0 execution failed for case {}", i + 1, e);
                results.add(CodeRunResponse.TestCaseResult.builder()
                        .index(i + 1).passed(false).error("Runner error: " + e.getMessage()).build());
            }
        }

        return CodeRunResponse.builder()
                .totalTests(testCases.size())
                .passed(passed).failed(testCases.size() - passed)
                .allPassed(passed == testCases.size())
                .compileError(compileError)
                .results(results)
                .build();
    }

    private Judge0Response submitToJudge0(String code, String language, CodeRunRequest.TestCaseInput tc) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        if (!apiKey.isBlank()) {
            headers.set("X-RapidAPI-Key", apiKey);
            headers.set("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com");
        }

        Judge0Request request = Judge0Request.builder()
                .source_code(code)
                .language_id(getLanguageId(language))
                .stdin(tc.getInput())
                .expected_output(tc.getExpectedOutput())
                .build();

        HttpEntity<Judge0Request> entity = new HttpEntity<>(request, headers);
        
        // Use wait=true for synchronous execution (simplest for this architecture)
        String url = apiUrl + "/submissions?wait=true&fields=stdout,stderr,status_id,language_id,status,time,memory,compile_output,message";
        ResponseEntity<Judge0Response> response = restTemplate.exchange(url, HttpMethod.POST, entity, Judge0Response.class);
        
        return response.getBody();
    }

    private int getLanguageId(String lang) {
        return switch (lang.toLowerCase()) {
            case "java"       -> 62; // Java (OpenJDK 13.0.1)
            case "python"     -> 71; // Python (3.8.1)
            case "cpp"        -> 54; // C++ (GCC 9.2.0)
            case "c"          -> 50; // C (GCC 9.2.0)
            case "javascript" -> 63; // JavaScript (Node.js 12.14.0)
            default           -> 62;
        };
    }
}
