package com.ots.service;

import com.ots.dto.request.CodeRunRequest;
import com.ots.dto.response.CodeRunResponse;
import com.ots.entity.Submission;
import com.ots.entity.TestCase;
import com.ots.enums.SubmissionStatus;
import com.ots.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeExecutionService {

    private final SubmissionRepository submissionRepository;
    private final CodeRunnerService codeRunnerService;
    private final EngagementService engagementService;

    @Async
    @Transactional
    public void executeSubmission(Long submissionId) {
        log.info("Starting real execution for submission {}", submissionId);
        
        try {
            Submission submission = submissionRepository.findById(submissionId)
                    .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

            Long userId = submission.getUser().getId();
            // Record activity immediately (submission attempt)
            engagementService.recordActivity(userId, false);

            List<TestCase> testCases = submission.getProblem().getTestCases();
            
            if (testCases == null || testCases.isEmpty()) {
                submission.setStatus(SubmissionStatus.ACCEPTED);
                engagementService.recordActivity(userId, true);
                submission.setExecutionTime(0.01);
                submission.setMemoryUsed(8);
                submissionRepository.save(submission);
                return;
            }

            // Map entities to DTOs for the runner
            List<CodeRunRequest.TestCaseInput> cases = testCases.stream()
                    .map(tc -> CodeRunRequest.TestCaseInput.builder()
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .build())
                    .collect(Collectors.toList());

            CodeRunResponse result = codeRunnerService.run(CodeRunRequest.builder()
                    .code(submission.getCode())
                    .language(submission.getLanguage().name().toLowerCase())
                    .testCases(cases)
                    .build());

            if (result.getCompileError() != null) {
                submission.setStatus(SubmissionStatus.COMPILE_ERROR);
                submission.setErrorMessage(result.getCompileError());
            } else if (result.isAllPassed()) {
                submission.setStatus(SubmissionStatus.ACCEPTED);
                engagementService.recordActivity(userId, true);
            } else {
                // Find first non-passing case and set status
                CodeRunResponse.TestCaseResult failed = result.getResults().stream()
                        .filter(r -> !r.isPassed())
                        .findFirst()
                        .orElse(null);
                
                if (failed != null && "Time Limit Exceeded".equals(failed.getError())) {
                    submission.setStatus(SubmissionStatus.TIME_LIMIT_EXCEEDED);
                } else if (failed != null && failed.getError() != null && failed.getError().startsWith("Runtime error")) {
                    submission.setStatus(SubmissionStatus.RUNTIME_ERROR);
                    submission.setErrorMessage(failed.getError());
                } else {
                    submission.setStatus(SubmissionStatus.WRONG_ANSWER);
                }
            }

            // Update stats
            submission.setExecutionTime(result.getResults().stream().mapToLong(r -> r.getExecutionTimeMs()).max().orElse(0L) / 1000.0);
            submission.setMemoryUsed(0); // Judge0 memory tracking can be added here
            
            submissionRepository.save(submission);
            log.info("Finished execution for submission {}: {}", submissionId, submission.getStatus());
            
        } catch (Exception e) {
            log.error("Execution failed for submission {}", submissionId, e);
        }
    }
}
