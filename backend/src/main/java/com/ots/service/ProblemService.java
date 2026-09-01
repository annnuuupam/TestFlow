package com.ots.service;

import com.ots.dto.request.ProblemRequest;
import com.ots.dto.response.ProblemResponse;
import com.ots.dto.response.TestCaseResponse;
import com.ots.entity.Contest;
import com.ots.entity.Problem;
import com.ots.entity.TestCase;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.ContestRepository;
import com.ots.repository.ProblemRepository;
import com.ots.repository.SubmissionRepository;
import com.ots.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final SubmissionRepository submissionRepository;
    private final ContestRepository contestRepository;

    @Transactional
    public ProblemResponse createProblem(ProblemRequest request) {
        Problem problem = Problem.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .tags(request.getTags())
                .timeLimit(request.getTimeLimit() != null ? request.getTimeLimit() : 2.0)
                .memoryLimit(request.getMemoryLimit() != null ? request.getMemoryLimit() : 256)
                .build();

        Problem savedProblem = problemRepository.save(problem);

        if (request.getTestCases() != null && !request.getTestCases().isEmpty()) {
            List<TestCase> testCases = request.getTestCases().stream().map(tcRequest -> 
                TestCase.builder()
                        .problem(savedProblem)
                        .input(tcRequest.getInput())
                        .expectedOutput(tcRequest.getExpectedOutput())
                        .isHidden(tcRequest.getIsHidden() != null ? tcRequest.getIsHidden() : false)
                        .build()
            ).collect(Collectors.toList());
            testCaseRepository.saveAll(testCases);
            savedProblem.setTestCases(testCases);
        }

        return mapToResponse(savedProblem, isAdmin());
    }

    public List<ProblemResponse> getAllProblems() {
        boolean includeHidden = isAdmin();
        return problemRepository.findAll().stream()
                .map(p -> mapToResponse(p, includeHidden))
                .collect(Collectors.toList());
    }

    public ProblemResponse getProblemById(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Problem", id));
        return mapToResponse(problem, isAdmin());
    }
    
    @Transactional
    public void deleteProblem(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Problem", id));

        // Remove the problem from any contests that reference it
        for (Contest contest : contestRepository.findByProblemsId(id)) {
            contest.getProblems().removeIf(p -> p.getId().equals(id));
            contestRepository.save(contest);
        }

        // Delete dependent rows before the problem itself (FK constraints)
        submissionRepository.deleteByProblemId(id);
        testCaseRepository.deleteByProblemId(id);
        problem.setTestCases(new java.util.ArrayList<>());
        problemRepository.delete(problem);
    }

    private ProblemResponse mapToResponse(Problem problem, boolean includeHidden) {
        return ProblemResponse.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .description(problem.getDescription())
                .difficulty(problem.getDifficulty())
                .tags(problem.getTags())
                .timeLimit(problem.getTimeLimit())
                .memoryLimit(problem.getMemoryLimit())
                .testCases(problem.getTestCases() != null ? problem.getTestCases().stream()
                        .filter(tc -> includeHidden || !Boolean.TRUE.equals(tc.getIsHidden()))
                        .map(tc -> TestCaseResponse.builder()
                                .id(tc.getId())
                                .input(tc.getInput())
                                .expectedOutput(tc.getExpectedOutput())
                                .isHidden(tc.getIsHidden())
                                .build())
                        .collect(Collectors.toList()) : null)
                .build();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
