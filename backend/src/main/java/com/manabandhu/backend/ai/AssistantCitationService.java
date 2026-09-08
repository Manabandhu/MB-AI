package com.manabandhu.backend.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssistantCitationService {

    private final AssistantCitationRepository repository;

    AssistantCitationService(AssistantCitationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AssistantCitation> findByMessage(UUID messageId) {
        return repository.findByMessageIdOrderByCreatedAtAsc(messageId);
    }

    @Transactional(readOnly = true)
    public List<AssistantCitation> listRecent() {
        return repository.findTop20ByOrderByCreatedAtDesc();
    }

    @Transactional
    public AssistantCitation create(UUID messageId, String title, String url, String snippet) {
        return repository.save(new AssistantCitation(messageId, title, url, snippet));
    }
}
