package org.example.repository;

import org.example.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findAllBySender_IdAndReceiver_IdOrSender_IdAndReceiver_Id(Long senderId,Long receiverId, Long senderId2, Long receiverId2);

    List<Message> findAllBySender_IdOrReceiver_IdOrderByTimeSentDesc(Long id, Long id2);

    @Query(value = """
    SELECT *
    FROM (
        SELECT *
        FROM message
        WHERE sender_id = :userId
        UNION ALL
        SELECT *
        FROM message
        WHERE receiver_id = :userId
    ) sub
    ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), time_sent DESC
    """, nativeQuery = true)
    List<Message> findLastMessagesPerChat(Long userId);

}
