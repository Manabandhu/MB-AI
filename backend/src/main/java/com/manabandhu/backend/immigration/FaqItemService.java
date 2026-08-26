package com.manabandhu.backend.immigration;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FaqItemService {

    private final FaqItemRepository repository;

    FaqItemService(FaqItemRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<FaqItem> findAllPublished() {
        return repository.findByPublishedTrueOrderBySortOrderAsc();
    }

    @Transactional(readOnly = true)
    public List<FaqItem> findByCategory(String category) {
        return repository.findByCategoryOrderBySortOrderAsc(category);
    }

    @Transactional
    public FaqItem create(String question, String answer, String category, String tags, boolean published, int sortOrder) {
        return repository.save(new FaqItem(question, answer, category, tags, published, sortOrder));
    }
}
