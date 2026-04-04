package com.ots.config;

import com.ots.entity.User;
import com.ots.enums.Role;
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

    @Value("${app.bootstrap-admin.enabled:true}")
    private boolean bootstrapAdminEnabled;

    @Value("${app.bootstrap-admin.username:admin}")
    private String adminUsername;

    @Value("${app.bootstrap-admin.password:admin123}")
    private String adminPassword;

    @Value("${app.bootstrap-admin.email:admin@example.com}")
    private String adminEmail;

    @Override
    public void run(String... args) {
        if (bootstrapAdminEnabled) {
            ensureAdminExists();
        } else {
            log.info("Bootstrap admin creation is disabled");
        }
    }

    private void ensureAdminExists() {
        if (userRepository.findByUsername(adminUsername).isPresent()) {
            log.info("Bootstrap admin already exists: {}", adminUsername);
            return;
        }

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
}
