package com.ots.controller;

import com.ots.dto.response.ProfileResponse;
import com.ots.entity.*;
import com.ots.repository.*;
import com.ots.service.EngagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final EngagementService engagementService;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile(Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        UserProfile profile = engagementService.getOrCreateProfile(user.getId());
        
        List<UserBadge> earnedBadges = userBadgeRepository.findByUserId(user.getId());
        List<Badge> allBadges = badgeRepository.findAll();
        
        List<ProfileResponse.BadgeResponse> badgeResponses = allBadges.stream()
            .map(b -> {
                Optional<UserBadge> earned = earnedBadges.stream()
                        .filter(ub -> ub.getBadge().getId().equals(b.getId()))
                        .findFirst();
                
                return ProfileResponse.BadgeResponse.builder()
                        .id(b.getId())
                        .name(b.getName())
                        .description(b.getDescription())
                        .iconUrl(b.getIconUrl())
                        .isEarned(earned.isPresent())
                        .awardedAt(earned.map(ub -> ub.getAwardedAt().toString()).orElse(null))
                        .build();
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(ProfileResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .bio(profile.getBio())
                .profilePicture(profile.getProfilePicture())
                .skills(profile.getSkills() != null ? Arrays.asList(profile.getSkills().split(",")) : List.of())
                .currentStreak(profile.getCurrentStreak())
                .maxStreak(profile.getMaxStreak())
                .totalSolved(profile.getTotalSolved())
                .totalSubmissions(profile.getTotalSubmissions())
                .accuracy(profile.getAccuracy())
                .githubUrl(profile.getGithubUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .twitterUrl(profile.getTwitterUrl())
                .lastActiveDate(profile.getLastActiveDate())
                .badges(badgeResponses)
                .build());
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ProfileResponse.ActivityPoint>> getMyActivity(Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        List<UserActivity> activities = engagementService.getRecentActivity(user.getId());
        
        List<ProfileResponse.ActivityPoint> result = activities.stream()
                .map(a -> ProfileResponse.ActivityPoint.builder()
                        .date(a.getActivityDate().toString())
                        .count(a.getSolveCount())
                        .build())
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(result);
    }

    @PutMapping("/me")
    public ResponseEntity<Void> updateProfile(@RequestBody Map<String, Object> updates, Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        UserProfile profile = engagementService.getOrCreateProfile(user.getId());
        
        if (updates.containsKey("fullName")) {
            user.setFullName((String) updates.get("fullName"));
            userRepository.save(user);
        }
        if (updates.containsKey("bio")) profile.setBio((String) updates.get("bio"));
        if (updates.containsKey("profilePicture")) profile.setProfilePicture((String) updates.get("profilePicture"));
        if (updates.containsKey("githubUrl")) profile.setGithubUrl((String) updates.get("githubUrl"));
        if (updates.containsKey("linkedinUrl")) profile.setLinkedinUrl((String) updates.get("linkedinUrl"));
        if (updates.containsKey("twitterUrl")) profile.setTwitterUrl((String) updates.get("twitterUrl"));
        if (updates.containsKey("skills") && updates.get("skills") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> skills = (List<String>) updates.get("skills");
            profile.setSkills(String.join(",", skills));
        }
        
        profileRepository.save(profile);
        return ResponseEntity.ok().build();
    }
}
