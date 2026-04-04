package com.ots.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "attempt_answers")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private TestAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /** Comma-separated Option IDs for MCQ/MULTI_SELECT */
    @Column(name = "selected_option_ids")
    private String selectedOptionIds;

    /** Text answer for CODING questions */
    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    @Column(name = "code_language")
    private String codeLanguage;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "marks_obtained")
    @Builder.Default
    private Double marksObtained = 0.0;

    @Column(name = "is_marked_for_review")
    @Builder.Default
    private Boolean isMarkedForReview = false;

    @CreatedDate
    @Column(name = "answered_at")
    private LocalDateTime answeredAt;
}
