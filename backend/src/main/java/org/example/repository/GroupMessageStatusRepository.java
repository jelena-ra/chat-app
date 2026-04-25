package org.example.repository;

import org.example.model.GroupMessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface GroupMessageStatusRepository extends JpaRepository<GroupMessageStatus, Long> {

    @Modifying
    @Query("""
        UPDATE GroupMessageStatus s
        SET s.read = true
        WHERE s.user.email = :email
          AND s.message.group.id = :groupId
          AND s.read = false
    """)
    int markGroupMessagesAsRead(String email, Long groupId);

    boolean existsByUser_EmailAndMessage_Group_IdAndReadFalse(String email, Long groupId);

    boolean existsByUser_EmailAndMessage_IdAndReadFalse(String email, Long messageId);
}