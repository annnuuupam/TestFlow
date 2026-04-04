package com.ots.service;

import com.ots.dto.request.SubmissionRequest;
import com.ots.dto.response.SubmissionResponse;
import com.ots.entity.Problem;
import com.ots.entity.Submission;
import com.ots.entity.User;
import com.ots.enums.SubmissionStatus;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.ProblemRepository;
import com.ots.repository.SubmissionRepository;
import com.ots.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final CodeExecutionService codeExecutionService;

    @Transactional
    public SubmissionResponse submitCode(String username, SubmissionRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
                
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new ResourceNotFoundException("Problem", request.getProblemId()));

        Submission submission = Submission.builder()
                .user(user)
                .problem(problem)
                .code(request.getCode())
                .language(request.getLanguage())
                .status(SubmissionStatus.PENDING)
                .build();

        submission = submissionRepository.save(submission);

        // Process code asynchronously
        codeExecutionService.executeSubmission(submission.getId());

        return mapToResponse(submission);
    }

    public List<SubmissionResponse> getUserSubmissions(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return submissionRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public SubmissionResponse getSubmissionById(Long id) { // Helpful for polling status
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", id));
        return mapToResponse(submission);
    }

    private SubmissionResponse mapToResponse(Submission submission) {
        return SubmissionResponse.builder()
                .id(submission.getId())
                .problemId(submission.getProblem().getId())
                .problemTitle(submission.getProblem().getTitle())
                .code(submission.getCode())
                .language(submission.getLanguage())
                .status(submission.getStatus())
                .executionTime(submission.getExecutionTime())
                .memoryUsed(submission.getMemoryUsed())
                .errorMessage(submission.getErrorMessage())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }
}
