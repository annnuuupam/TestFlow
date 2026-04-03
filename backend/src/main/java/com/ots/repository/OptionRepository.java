package com.ots.repository;

import com.ots.entity.Option;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OptionRepository extends JpaRepository<Option, Long> {
    List<Option> findByQuestionIdOrderByDisplayOrder(Long questionId);
    void deleteByQuestionId(Long questionId);
}
