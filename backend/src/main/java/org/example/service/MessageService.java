package org.example.service;

import jakarta.transaction.Transactional;
import org.example.dtos.MessageDTO;
import org.example.model.Message;
import org.example.model.User;
import org.example.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private  MessageRepository _messageRepository;

    @Autowired
    private UserService userService;

    public Message saveMessage(MessageDTO message){
        User sender = userService.getByEmail(message.getSenderEmail());
        User receiver = userService.getByEmail(message.getReceiverEmail());
        Message mess = new Message(null,message.getClientId(),message.getContent(), message.getSignature() , message.isDisappearing(),false, false, message.isRead(), LocalDateTime.now(),sender, receiver);
        return _messageRepository.save(mess);
    }

    public List<MessageDTO> getFromChat(String senderEmail, String receiverEmail){
        Long senderId = userService.getByEmail(senderEmail).getId();
        Long receiverId = userService.getByEmail(receiverEmail).getId();
        List<MessageDTO> list = new ArrayList<MessageDTO>();
         _messageRepository.findAllBySender_IdAndReceiver_IdOrSender_IdAndReceiver_Id(senderId,receiverId, receiverId, senderId).forEach(m-> list.add(new MessageDTO(m)));
         return list;
    }
/*
    public Map<String,MessageDTO> getChatsAndLastMessage(String userEmail){
        long start = System.currentTimeMillis();
        Long id = userService.getByEmail(userEmail).getId();
        Map<String,MessageDTO> map = _messageRepository.findLastMessagesPerChat(id).stream()
                .map(MessageDTO::new)
                .collect(Collectors.toMap(
                        msg -> msg.getSenderEmail().equals(userEmail) ? msg.getReceiverEmail() : msg.getSenderEmail(),
                        msg -> msg,
                        (existing, replacement) -> existing
                ));
        System.out.println("getChats backend time: " + (System.currentTimeMillis() - start) + " ms");
        return map;

    }*/

    public Map<String, MessageDTO> getChatsAndLastMessage(String userEmail) {
        long start = System.currentTimeMillis();

        Long id = userService.getByEmail(userEmail).getId();
        Map<String, MessageDTO> map = _messageRepository.findLastMessagesPerChat(id)
                .stream()
                .map(p -> new MessageDTO(
                        p.getClientId(),
                        p.getContent(),
                        null,
                        false,
                        p.getTimeSent(),
                        p.getSenderEmail(),
                        p.getReceiverEmail(),
                        p.getRead()
                ))
                .collect(Collectors.toMap(
                        msg -> msg.getSenderEmail().equals(userEmail)
                                ? msg.getReceiverEmail()
                                : msg.getSenderEmail(),
                        msg -> msg,
                        (existing, replacement) -> existing
                ));

        System.out.println("getChats backend time: " + (System.currentTimeMillis() - start) + " ms");
        return map;
    }
    @Transactional
    public List<String> markAsReadAllInChat (String email, String friendEmail){
        List<String> ids = _messageRepository.findUnreadMessageIdsInChat(email, friendEmail);
        if (!ids.isEmpty()) {
            _messageRepository.markAllAsReadInChat(email, friendEmail);
        }
        return ids;
    }

    public boolean verifySignature(String contentBase64, String signatureBase64, String publicKeyBase64) {
            try {

                byte[] messageBytes = Base64.getDecoder().decode(contentBase64);
                byte[] signatureBytes = Base64.getDecoder().decode(signatureBase64);
                byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);


                Ed25519PublicKeyParameters pubKeyParams = new Ed25519PublicKeyParameters(publicKeyBytes, 0);


                Ed25519Signer verifier = new Ed25519Signer();
                verifier.init(false, pubKeyParams);


                verifier.update(messageBytes, 0, messageBytes.length);


                return verifier.verifySignature(signatureBytes);

            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

}
