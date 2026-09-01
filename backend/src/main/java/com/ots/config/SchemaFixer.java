package com.ots.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures database constraints are correctly updated to support
 * both standalone Problems and Exam Questions.
 */
@Component
@RequiredArgsConstructor
public class SchemaFixer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixConstraints() {
        try {
            // Explicitly allow NULL for problem_id in test_cases
            jdbcTemplate.execute("ALTER TABLE test_cases MODIFY problem_id BIGINT NULL;");
            System.out.println("✅ SchemaFixer: Successfully set test_cases.problem_id to NULLABLE");
        } catch (Exception e) {
            // Silently fail if column already nullable or table doesn't exist yet
            System.err.println("ℹ️ SchemaFixer Tip: If adding a coding question still fails, " +
                               "manually run 'ALTER TABLE test_cases MODIFY problem_id BIGINT NULL' in your MySQL workbench.");
        }
        try {
            // Allow NULL for section_id in questions -> supports the standalone Question Bank
            jdbcTemplate.execute("ALTER TABLE questions MODIFY section_id BIGINT NULL;");
            System.out.println("✅ SchemaFixer: Successfully set questions.section_id to NULLABLE (Question Bank)");
        } catch (Exception e) {
            System.err.println("ℹ️ SchemaFixer Tip: If the question bank fails, " +
                               "manually run 'ALTER TABLE questions MODIFY section_id BIGINT NULL' in your MySQL workbench.");
        }
    }
}
