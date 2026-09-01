package com.ots.repository;

import com.ots.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySectionIdOrderByDisplayOrder(Long sectionId);
    List<Question> findBySectionIsNullOrderByIdDesc();
    long countBySectionId(Long sectionId);
    void deleteBySectionId(Long sectionId);
}
