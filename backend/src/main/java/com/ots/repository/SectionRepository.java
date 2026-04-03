package com.ots.repository;

import com.ots.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByExamIdOrderByDisplayOrder(Long examId);
    void deleteByExamId(Long examId);
}
