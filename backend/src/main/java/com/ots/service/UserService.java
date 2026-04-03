package com.ots.service;

import com.ots.dto.response.UserResponse;
import com.ots.entity.User;
import com.ots.enums.Role;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.TestAttemptRepository;
import com.ots.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TestAttemptRepository attemptRepository;

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

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", id);
        }
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
