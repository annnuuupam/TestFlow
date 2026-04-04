package com.ots.service;

import com.ots.dto.request.CodeRunRequest;
import com.ots.dto.response.CodeRunResponse;
import com.ots.service.executor.CodeExecutor;
import com.ots.service.executor.Judge0Executor;
import com.ots.service.executor.LocalCodeExecutor;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeRunnerService {

    private final LocalCodeExecutor localExecutor;
    private final Judge0Executor judge0Executor;

    @Value("${app.code-runner.enabled:true}")
    private boolean codeRunnerEnabled;

    @Value("${app.code-runner.strategy:local}")
    private String strategy;

    private CodeExecutor executor;

    @PostConstruct
    public void init() {
        if ("judge0".equalsIgnoreCase(strategy)) {
            this.executor = judge0Executor;
            log.info("CodeRunnerService initialized with Judge0 strategy");
        } else {
            this.executor = localExecutor;
            log.info("CodeRunnerService initialized with Local strategy (warning: not for production)");
        }
    }

    public CodeRunResponse run(CodeRunRequest request) {
        if (!codeRunnerEnabled) {
            return buildComingSoonResponse(request);
        }

        return executor.execute(request.getCode(), request.getLanguage(), request.getTestCases());
    }

    private CodeRunResponse buildComingSoonResponse(CodeRunRequest request) {
        List<CodeRunRequest.TestCaseInput> testCases = request.getTestCases();
        int total = testCases == null ? 0 : testCases.size();
        
        return CodeRunResponse.builder()
                .totalTests(total)
                .passed(0)
                .failed(total)
                .allPassed(false)
                .compileError("Code execution is currently disabled on this server.")
                .results(List.of())
                .build();
    }
}
