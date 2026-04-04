package com.ots.scheduler;

import com.ots.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class StreakScheduler {

    private final UserProfileRepository profileRepository;

    /**
     * Resets current streaks to 0 for users who were not active yesterday.
     * Runs at 00:05 AM every day.
     */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void resetExpiredStreaks() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("🕒 Running Daily Streak Reset Scheduler for activity before {}", yesterday);
        
        int updated = profileRepository.resetOldStreaks(yesterday);
        
        log.info("✅ Streak Reset Complete. Reset {} expired streaks.", updated);
    }
}
