package org.example.controller;

import org.example.dtos.MessageDTO;
import org.example.model.Message;
import org.example.service.MessageService;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    private UserService _userService;

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
            message.setTimeSent(LocalDateTime.now());
            _messageService.saveMessage(message);

            messagingTemplate.convertAndSendToUser(
                    message.getReceiverEmail(),
                    "/queue/messages",
                    message
            );
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
}
