package org.example.service;

import jakarta.transaction.Transactional;
import org.example.dtos.GroupChatDTO;
import org.example.dtos.MessageDTO;
import org.example.model.*;
import org.example.model.enums.DisappearingStatus;
import org.example.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

@Service
public class MessageService {

    @Autowired
    private  MessageRepository _messageRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private ImageService imageService;

    @Autowired
    private GroupMessageStatusService groupMessageStatusService;

    public Message saveMessage(MessageDTO message){
        User sender = userService.getByEmail(message.getSenderEmail());
        User receiver = null;
        if (message.getReceiverEmail() != null) {
            receiver = userService.getByEmail(message.getReceiverEmail());
        }
        Group group = null;
        if(message.getGroupId()!=null){
         group = groupService.getById(message.getGroupId());
            }
        List<Image> images = new ArrayList<>();
        if (message.getImageIds() != null && !message.getImageIds().isEmpty()) {
            images = message.getImageIds()
                    .stream()
                    .filter(id -> id != null)
                    .map(id -> imageService.findById(id))
                    .toList();
        }
        Message mess = new Message(null,message.getClientId(),message.getContent(), message.getSignature() , message.getDisappearingStatus(),false, false, message.isRead(), LocalDateTime.now(),sender, receiver, group,images);

        return _messageRepository.save(mess);
    }

    public List<MessageDTO> getGroupMessages(Long groupId, String userEmail) {
        List<Message> messages = _messageRepository.findAllByGroup_IdOrderByTimeSentAsc(groupId);

        List<MessageDTO> dtos = new ArrayList<>();

        for (Message message : messages) {
            GroupMessageStatus status = groupMessageStatusService.getByEmailAndMessageId(userEmail, message.getId());
            MessageDTO msg = new MessageDTO(message);
            if(msg.getDisappearingStatus()==DisappearingStatus.DISAPPEARING){
                if (status.getOpened()) msg.setDisappearingStatus(DisappearingStatus.READ);
            }

            dtos.add(msg);
        }

        return dtos;
    }
    public Message openGroupDisappearing(String clientId, String userEmail){
        Message mssg = _messageRepository.findByClientId(clientId).orElse(null);
        if(mssg!=null){
            groupMessageStatusService.openDisappearingMssg(userEmail,mssg.getId());
        }
        return mssg;
    }

    public List<Long> addImages( List<MultipartFile> files) throws IOException {
        List<Long> ids = new ArrayList<>();

        for (MultipartFile file : files) {
            Image created = imageService.createImageFromFile(file);
            Image saved = imageService.saveImage(created);
            ids.add(saved.getId());
        }
        return ids;
    }

    public Image findImageById(Long id){
        return imageService.findById(id);
    }
public Message openDisappearing(String clientId){
        Message mssg = _messageRepository.findByClientId(clientId).orElse(null);
        if(mssg!=null){
            mssg.setDisappearingStatus(DisappearingStatus.READ);
            _messageRepository.save(mssg);
        }
        return mssg;
}
    public List<GroupChatDTO> getGroupChatPreviews(String email) {

        List<Group> groups = groupService.getMyGroups(email);

        List<GroupChatDTO> previews = new ArrayList<>();

        for (Group group : groups) {

            Message lastMessage = _messageRepository
                    .findTopByGroup_IdOrderByTimeSentDesc(group.getId())
                    .orElse(null);



            if (lastMessage == null) {
                previews.add(new GroupChatDTO(
                        group.getId(),
                        group.getName(),
                        group.getAdmin().getEmail(),
                        null,
                        null,
                        null,
                        true
                ));
            } else {

                GroupMessageStatus gs = groupMessageStatusService.getByEmailAndMessageId(email, lastMessage.getId());


                previews.add(new GroupChatDTO(
                        group.getId(),
                        group.getName(),
                        group.getAdmin().getEmail(),
                        lastMessage.getContent(),
                        lastMessage.getTimeSent().toString(),
                        lastMessage.getSender().getEmail(),
                        gs!=null && gs.isRead()
                ));
            }
        }

        return previews;
    }

    public List<MessageDTO> getFromChat(String senderEmail, String receiverEmail){
        Long senderId = userService.getByEmail(senderEmail).getId();
        Long receiverId = userService.getByEmail(receiverEmail).getId();
        List<MessageDTO> list = new ArrayList<MessageDTO>();
         _messageRepository.findAllBySender_IdAndReceiver_IdOrSender_IdAndReceiver_IdOrderByTimeSentAsc(senderId,receiverId, receiverId, senderId).forEach(m-> list.add(new MessageDTO(m)));
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
                        p.getDisappearingStatus(),
                        p.getTimeSent(),
                        p.getSenderEmail(),
                        p.getReceiverEmail(),
                        p.getRead(),
                        p.getGroupId(),
                        p.getImageIds()
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
