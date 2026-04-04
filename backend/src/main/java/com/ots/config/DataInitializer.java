package com.ots.config;

import com.ots.entity.User;
import com.ots.entity.Badge;
import com.ots.enums.Role;
import com.ots.repository.BadgeRepository;
import com.ots.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BadgeRepository badgeRepository;

    @Value("${app.bootstrap-admin.enabled:true}")
    private boolean bootstrapAdminEnabled;

    @Value("${app.bootstrap-admin.username:admin}")
    private String adminUsername;

    @Value("${app.bootstrap-admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.bootstrap-admin.email:admin@example.com}")
    private String adminEmail;

    @Override
    public void run(String... args) {
        if (bootstrapAdminEnabled) {
            ensureAdminExists();
        }
        ensureBadgesExist();
    }

    private void ensureBadgesExist() {
        createBadgeIfMissing("First Solve", "Solved your first coding problem on TestFlow!", "FIRST_SOLVE", 1);
        createBadgeIfMissing("Week Streak", "Maintained a 7-day consistency streak.", "STREAK", 7);
        createBadgeIfMissing("Monthly Master", "Maintained a 30-day consistency streak.", "STREAK", 30);
        createBadgeIfMissing("Code Warrior", "Solved 50 coding problems.", "SOLVE_COUNT", 50);
        createBadgeIfMissing("Algorithm Grandmaster", "Solved 100 coding problems.", "SOLVE_COUNT", 100);
    }

    private void createBadgeIfMissing(String name, String desc, String type, int val) {
        if (badgeRepository.findByConditionType(type).stream().anyMatch(b -> b.getConditionValue() == val)) return;
        
        badgeRepository.save(Badge.builder()
                .name(name)
                .description(desc)
                .conditionType(type)
                .conditionValue(val)
                .build());
        log.info("🏅 Badge initialized: {}", name);
    }

    private void ensureAdminExists() {
        userRepository.findByUsername(adminUsername).ifPresentOrElse(
            admin -> {
                log.info("Admin already exists. Updating password for {}.", adminUsername);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                userRepository.save(admin);
            },
            () -> {
                User admin = User.builder()
                        .username(adminUsername)
                        .email(adminEmail)
                        .fullName("ADMIN")
                        .password(passwordEncoder.encode(adminPassword))
                        .role(Role.ADMIN)
                        .isActive(true)
                        .build();

                userRepository.save(admin);
                log.warn("Default admin account created: {} / {}. Change this password immediately.", adminUsername, adminPassword);
            }
        );
    }
}
