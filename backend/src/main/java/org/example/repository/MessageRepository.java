package org.example.repository;

import org.example.model.LastChatMessageProjection;
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

    /*@Query(value = """
             SELECT m
                        FROM Message m
                        JOIN FETCH m.sender
                        JOIN FETCH m.receiver
                        WHERE m.id IN (
                            SELECT MAX(m2.id)
                            FROM Message m2
                            WHERE m2.sender.id = :userId OR m2.receiver.id = :userId
                            GROUP BY LEAST(m2.sender.id, m2.receiver.id), GREATEST(m2.sender.id, m2.receiver.id)
                        )
                        ORDER BY m.timeSent DESC
    """)
    List<Message> findLastMessagesPerChat(Long userId);*/
    @Query(value = """
    SELECT DISTINCT ON (
        LEAST(m.sender_id, m.receiver_id),
        GREATEST(m.sender_id, m.receiver_id)
    )
        m.content AS content,
        m.time_sent AS timeSent,
        s.email AS senderEmail,
        r.email AS receiverEmail
    FROM message m
    JOIN users s ON s.id = m.sender_id
    JOIN users r ON r.id = m.receiver_id
    WHERE m.sender_id = :userId OR m.receiver_id = :userId
    ORDER BY
        LEAST(m.sender_id, m.receiver_id),
        GREATEST(m.sender_id, m.receiver_id),
        m.time_sent DESC
""", nativeQuery = true)
    List<LastChatMessageProjection> findLastMessagesPerChat(@Param("userId") Long userId);

}
