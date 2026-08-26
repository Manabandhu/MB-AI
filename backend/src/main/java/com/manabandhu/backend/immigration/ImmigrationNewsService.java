package com.manabandhu.backend.immigration;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImmigrationNewsService {

    private final ImmigrationNewsRepository repository;

    ImmigrationNewsService(ImmigrationNewsRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ImmigrationNews> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ImmigrationNews> findByCategory(String category) {
        return repository.findByCategoryOrderByPublishedAtDesc(category);
    }

    @Transactional
    public ImmigrationNews create(String title, String body, String source, String url, String category, java.time.Instant publishedAt) {
        return repository.save(new ImmigrationNews(title, body, source, url, category, publishedAt));
    }
}
