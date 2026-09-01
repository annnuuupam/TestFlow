package com.ots.repository;

import com.ots.entity.Exam;
import com.ots.enums.TestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    Page<Exam> findByStatus(TestStatus status, Pageable pageable);
    List<Exam> findByStatus(TestStatus status);
    long countByStatus(TestStatus status);

    @Query("SELECT e FROM Exam e WHERE e.status = 'ACTIVE' " +
           "AND (e.startTime IS NULL OR e.startTime <= :now) " +
           "AND (e.endTime IS NULL OR e.endTime >= :now)")
    List<Exam> findCurrentlyActiveExams(@Param("now") LocalDateTime now);

    @Query("SELECT e FROM Exam e WHERE " +
           "(:search IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<Exam> searchExams(@Param("search") String search, Pageable pageable);

    @Modifying
    @Query("UPDATE Exam e SET e.createdBy = null WHERE e.createdBy.id = :userId")
    void clearCreatedByForUser(@Param("userId") Long userId);
}
