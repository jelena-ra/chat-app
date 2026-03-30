package org.example.service;

import org.example.dtos.MessageDTO;
import org.example.model.Message;
import org.example.model.User;
import org.example.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private  MessageRepository _messageRepository;

    @Autowired
    private UserService userService;

    public Message saveMessage(MessageDTO message){
        User sender = userService.getByEmail(message.getSenderEmail());
        User receiver = userService.getByEmail(message.getReceiverEmail());
        Message mess = new Message(null,message.getContent(), message.getSignature() , message.isDisappearing(),false, false, false, LocalDateTime.now(),sender, receiver);
        return _messageRepository.save(mess);
    }

    public List<MessageDTO> getFromChat(String senderEmail, String receiverEmail){
        Long senderId = userService.getByEmail(senderEmail).getId();
        Long receiverId = userService.getByEmail(receiverEmail).getId();
        List<MessageDTO> list = new ArrayList<MessageDTO>();
         _messageRepository.findAllBySender_IdAndReceiver_IdOrSender_IdAndReceiver_Id(senderId,receiverId, receiverId, senderId).forEach(m-> list.add(new MessageDTO(m)));
         return list;
    }

}
