package com.ots.repository;

import com.ots.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUserId(Long userId);

    @Modifying
    @Query("UPDATE UserProfile up SET up.currentStreak = 0 WHERE up.lastActiveDate < :cutoffDate")
    int resetOldStreaks(@Param("cutoffDate") LocalDate cutoffDate);
}
