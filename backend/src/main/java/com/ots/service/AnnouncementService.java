package com.ots.service;

import com.ots.dto.response.AnnouncementResponse;
import com.ots.entity.Announcement;
import com.ots.entity.User;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.AnnouncementRepository;
import com.ots.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    public List<AnnouncementResponse> getActiveAnnouncements() {
        return announcementRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<AnnouncementResponse> getAllAnnouncements(Pageable pageable) {
        return announcementRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(String title, String content, String username) {
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Announcement announcement = Announcement.builder()
                .title(title)
                .content(content)
                .isActive(true)
                .createdBy(creator)
                .build();

        announcementRepository.save(announcement);
        return mapToResponse(announcement);
    }

    @Transactional
    public void toggleAnnouncement(Long id) {
        Announcement ann = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
        ann.setIsActive(!ann.getIsActive());
        announcementRepository.save(ann);
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        if (!announcementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Announcement", id);
        }
        announcementRepository.deleteById(id);
    }

    private AnnouncementResponse mapToResponse(Announcement ann) {
        return AnnouncementResponse.builder()
                .id(ann.getId())
                .title(ann.getTitle())
                .content(ann.getContent())
                .isActive(ann.getIsActive())
                .createdBy(ann.getCreatedBy() != null ? ann.getCreatedBy().getUsername() : null)
                .createdAt(ann.getCreatedAt())
                .build();
    }
}
