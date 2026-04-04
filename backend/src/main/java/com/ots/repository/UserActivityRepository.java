package com.ots.repository;

import com.ots.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    Optional<UserActivity> findByUserIdAndActivityDate(Long userId, LocalDate activityDate);

    @Query("SELECT ua FROM UserActivity ua WHERE ua.user.id = :userId AND ua.activityDate >= :startDate")
    List<UserActivity> findRecentActivity(Long userId, LocalDate startDate);
}
