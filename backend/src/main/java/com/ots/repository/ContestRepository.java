package com.ots.repository;

import com.ots.entity.Contest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {

    @Query("SELECT DISTINCT c FROM Contest c JOIN c.problems p WHERE p.id = :problemId")
    List<Contest> findByProblemsId(@Param("problemId") Long problemId);
}
