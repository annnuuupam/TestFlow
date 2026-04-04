package com.ots.service;

import com.ots.entity.*;
import com.ots.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EngagementService {

    private final UserProfileRepository profileRepository;
    private final UserActivityRepository activityRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final BadgeRepository badgeRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordActivity(Long userId, boolean isSolve) {
        LocalDate today = LocalDate.now();
        UserProfile profile = getOrCreateProfile(userId);
        
        // 1. Update Heatmap/Daily Activity
        UserActivity activity = activityRepository.findByUserIdAndActivityDate(userId, today)
                .orElse(UserActivity.builder().user(profile.getUser()).activityDate(today).build());
        
        activity.setSubmissionCount(activity.getSubmissionCount() + 1);
        
        // 2. Update Profile General Stats
        profile.setTotalSubmissions((profile.getTotalSubmissions() != null ? profile.getTotalSubmissions() : 0) + 1);
        
        if (isSolve) {
            activity.setSolveCount(activity.getSolveCount() + 1);
            updateStreakAndSolveStats(profile, today);
            checkAndAwardBadges(profile);
        }
        
        // Recalculate Accuracy safely
        if (profile.getTotalSubmissions() > 0) {
            profile.setAccuracy((double) profile.getTotalSolved() / profile.getTotalSubmissions() * 100);
        }
        
        activityRepository.save(activity);
        profileRepository.save(profile);
    }

    private void updateStreakAndSolveStats(UserProfile profile, LocalDate today) {
        profile.setTotalSolved((profile.getTotalSolved() != null ? profile.getTotalSolved() : 0) + 1);
        
        // Streak logic
        if (profile.getLastActiveDate() == null) {
            profile.setCurrentStreak(1);
        } else if (profile.getLastActiveDate().equals(today.minusDays(1))) {
            profile.setCurrentStreak(profile.getCurrentStreak() + 1);
        } else if (!profile.getLastActiveDate().equals(today)) {
            profile.setCurrentStreak(1);
        }
        
        profile.setLastActiveDate(today);
        if (profile.getCurrentStreak() > profile.getMaxStreak()) {
            profile.setMaxStreak(profile.getCurrentStreak());
        }
    }

    private void checkAndAwardBadges(UserProfile profile) {
        Long userId = profile.getUser().getId();
        
        // Check First Solve
        if (profile.getTotalSolved() == 1) {
            awardIfEligible(userId, "FIRST_SOLVE", 1);
        }
        
        // Check Streaks
        awardIfEligible(userId, "STREAK", 7);
        awardIfEligible(userId, "STREAK", 30);
        
        // Check Solve Counts
        awardIfEligible(userId, "SOLVE_COUNT", 50);
        awardIfEligible(userId, "SOLVE_COUNT", 100);
    }

    private void awardIfEligible(Long userId, String type, Integer value) {
        List<Badge> eligible = badgeRepository.findByConditionType(type);
        for (Badge b : eligible) {
            if (b.getConditionValue().equals(value)) {
                if (!userBadgeRepository.existsByUserIdAndBadgeId(userId, b.getId())) {
                    User user = userRepository.findById(userId).orElse(null);
                    if (user != null) {
                        userBadgeRepository.save(UserBadge.builder().user(user).badge(b).build());
                        log.info("🏆 User {} earned badge: {}", user.getUsername(), b.getName());
                    }
                }
            }
        }
    }

    public UserProfile getOrCreateProfile(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId).orElseThrow();
                    UserProfile newProfile = UserProfile.builder().user(user).build();
                    return profileRepository.save(newProfile);
                });
    }

    public List<UserActivity> getRecentActivity(Long userId) {
        return activityRepository.findRecentActivity(userId, LocalDate.now().minusDays(365));
    }
}
