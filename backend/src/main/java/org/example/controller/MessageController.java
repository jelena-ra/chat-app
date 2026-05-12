package org.example.controller;

import org.example.dtos.GroupChatDTO;
import org.example.dtos.MessageDTO;
import org.example.dtos.OpenMessageDTO;
import org.example.dtos.ReadUpdateDTO;
import org.example.model.Group;
import org.example.model.Message;
import org.example.service.GroupMessageStatusService;
import org.example.service.GroupService;
import org.example.service.MessageService;
import org.example.service.UserService;
import org.example.service.presence.ActiveChatStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
public class MessageController {

    @Autowired
    private  SimpMessagingTemplate messagingTemplate;
    @Autowired
    private MessageService _messageService;
    @Autowired
    private GroupService groupService;
    @Autowired
    private ActiveChatStore activeChatStore;
    @Autowired
    private UserService _userService;
    @Autowired
    private GroupMessageStatusService groupMessageStatusService;


    @MessageMapping("/send")
    private void sendMessage(@RequestBody MessageDTO message){
        if (message.getReceiverEmail() != null) {
            System.out.println("Privatna poruka za: " + message.getReceiverEmail());
            System.out.println("poruka od: " + message.getSenderEmail());

            var sender = _userService.getByEmail(message.getSenderEmail());

            boolean isValid = _messageService.verifySignature(
                    message.getContent(),
                    message.getSignature(),
                    sender.getPublicKeySigning()
            );

            if (!isValid) {
                System.out.println("INVALID SIGNATURE");
                return;
            }

            boolean receiverisActive = activeChatStore.isUserActiveInChatWith(message.getReceiverEmail(), message.getSenderEmail());

            if(receiverisActive){
                message.setRead(true);
                System.out.println(("User je aktivan ne treba push notif"));
            }else{
                System.out.println(("User nije aktivan -> treba push notif"));
            }

            message.setTimeSent(LocalDateTime.now());
            _messageService.saveMessage(message);

            messagingTemplate.convertAndSendToUser(
                    message.getReceiverEmail(),
                    "/queue/messages",
                    message
            );

            if(message.isRead()){
                List<String> id = new ArrayList<>();
                id.add(message.getClientId());

                messagingTemplate.convertAndSendToUser(
                        message.getSenderEmail(),
                        "/queue/read",
                        new ReadUpdateDTO("messages-read", id)
                );
            }

        }
    }

    @GetMapping("/getfromChat")
    private ResponseEntity<List<MessageDTO>> getFromChat(@RequestParam String senderEmail, @RequestParam String receiverEmail){
        List<MessageDTO> list = _messageService.getFromChat(senderEmail, receiverEmail);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/getChats")
    private ResponseEntity <Map<String,MessageDTO>>getChats (@RequestParam String userEmail){
        return ResponseEntity.ok(_messageService.getChatsAndLastMessage(userEmail));
    }

    @MessageMapping("/group/{groupId}")
    public void sendGroupMessage(@RequestBody MessageDTO message) {

        Long groupId = message.getGroupId();
        Group group = groupService.getById(groupId);

        if (group == null) {
            System.out.println("Group not found.");
            return;
        }

        boolean allowed = groupService.isUserMember(groupId, message.getSenderEmail());
        if (!allowed) {
            System.out.println("Sender is not in group.");
            return;
        }

        var sender = _userService.getByEmail(message.getSenderEmail());

        boolean isValid = _messageService.verifySignature(
                message.getContent(),
                message.getSignature(),
                sender.getPublicKeySigning()
        );

        if (!isValid) {
            System.out.println("INVALID SIGNATURE");
            return;
        }

        message.setTimeSent(LocalDateTime.now());
        Message saved = _messageService.saveMessage(message);
        groupMessageStatusService.createStatusesForGroupMessage(saved);

        String destination = "/topic/group/" + groupId;
        messagingTemplate.convertAndSend(destination, message);

        System.out.println("Group message sent to group: " + groupId);
    }

    @GetMapping("/groupChats")
    public ResponseEntity<List<GroupChatDTO>> getGroupChats(@RequestParam String email) {
        return ResponseEntity.ok(_messageService.getGroupChatPreviews(email));
    }
    @GetMapping("/group")
    public ResponseEntity<List<MessageDTO>> getGroupMessages(@RequestParam Long groupId, @RequestParam String userEmail) {
        List<MessageDTO> messages = _messageService.getGroupMessages(groupId, userEmail);
        return ResponseEntity.ok(messages);
    }

    @MessageMapping("/open-message")
    public void openMessage(OpenMessageDTO openMessageDTO) {
        Message msg = _messageService.openDisappearing(openMessageDTO.getClientId());
        if(msg!=null && !msg.getSender().getEmail().equals(openMessageDTO.getUserEmail())) {
            List<String> id = new ArrayList<>();
            id.add(msg.getClientId());
            messagingTemplate.convertAndSendToUser(
                    msg.getReceiver().getEmail(),
                    "/queue/message-opened",
                    new ReadUpdateDTO("messages-opened", id)
            );
        }
    }

    @MessageMapping("/open-groupmessage")
    public void openGroupMessage(OpenMessageDTO openMessageDTO) {
        Message msg = _messageService.openGroupDisappearing(openMessageDTO.getClientId(), openMessageDTO.getUserEmail());
        if(msg!=null && !msg.getSender().getEmail().equals(openMessageDTO.getUserEmail())) {
            List<String> id = new ArrayList<>();
            id.add(msg.getClientId());
            messagingTemplate.convertAndSendToUser(
                    openMessageDTO.getUserEmail(),
                    "/queue/message-opened",
                    new ReadUpdateDTO("messages-opened", id)
            );
        }
    }
}
