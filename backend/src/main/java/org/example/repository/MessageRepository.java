package org.example.repository;

import org.example.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findAllBySender_IdAndReceiver_IdOrSender_IdAndReceiver_Id(Long senderId,Long receiverId, Long senderId2, Long receiverId2);
}
