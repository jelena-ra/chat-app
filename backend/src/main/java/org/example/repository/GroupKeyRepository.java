package org.example.repository;

import org.example.model.GroupKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupKeyRepository extends JpaRepository<GroupKey, Long> {
    Optional<GroupKey> findByGroup_IdAndUser_Email(Long groupId, String email);

    List<GroupKey> findAllByGroup_Id(Long groupId);

    void deleteAllByGroup_Id(Long groupId);
}
