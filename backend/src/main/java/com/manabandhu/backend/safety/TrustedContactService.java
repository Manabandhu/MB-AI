package com.manabandhu.backend.safety;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrustedContactService {

    private final TrustedContactRepository repository;

    TrustedContactService(TrustedContactRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<TrustedContact> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional
    public TrustedContact create(UUID ownerId, String name, String phone, String email, String relationship) {
        return repository.save(new TrustedContact(ownerId, name, phone, email, relationship));
    }
}
