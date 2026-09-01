package com.ots.service;

import com.ots.dto.response.UserResponse;
import com.ots.entity.TestAttempt;
import com.ots.entity.User;
import com.ots.enums.Role;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.AnnouncementRepository;
import com.ots.repository.AttemptAnswerRepository;
import com.ots.repository.ExamRepository;
import com.ots.repository.ResultRepository;
import com.ots.repository.SubmissionRepository;
import com.ots.repository.TestAttemptRepository;
import com.ots.repository.UserActivityRepository;
import com.ots.repository.UserBadgeRepository;
import com.ots.repository.UserProfileRepository;
import com.ots.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TestAttemptRepository attemptRepository;
    private final AttemptAnswerRepository answerRepository;
    private final SubmissionRepository submissionRepository;
    private final ResultRepository resultRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserActivityRepository userActivityRepository;
    private final UserProfileRepository userProfileRepository;
    private final AnnouncementRepository announcementRepository;
    private final ExamRepository examRepository;

    public Page<UserResponse> getAllUsers(String search, Pageable pageable) {
        Page<User> users = userRepository.searchUsers(search, pageable);
        return users.map(this::mapToResponse);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUserRole(Long id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setRole(role);
        userRepository.save(user);
        return mapToResponse(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (user.getRole() == Role.ADMIN) {
            throw new DataIntegrityViolationException("Admin accounts cannot be deleted");
        }

        // Remove all user-owned data before deleting the user itself (FK constraints)
        List<TestAttempt> attempts = attemptRepository.findByUserIdOrderByStartTimeDesc(id);
        for (TestAttempt ta : attempts) {
            answerRepository.deleteByAttemptId(ta.getId());
        }
        attemptRepository.deleteByUserId(id);          // attempt answers removed first
        submissionRepository.deleteByUserId(id);
        resultRepository.deleteByUserId(id);
        userBadgeRepository.deleteByUserId(id);
        userActivityRepository.deleteByUserId(id);
        userProfileRepository.deleteByUserId(id);
        announcementRepository.clearCreatedByForUser(id);
        examRepository.clearCreatedByForUser(id);

        userRepository.deleteById(id);
    }

    private UserResponse mapToResponse(User user) {
        long totalAttempts = attemptRepository.countByUserId(user.getId());
        long completedExams = attemptRepository.countCompletedExamsByUser(user.getId());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .totalAttempts(totalAttempts)
                .completedExams(completedExams)
                .build();
    }
}
