package org.example.controller;

import org.example.dtos.MessageDTO;
import org.example.model.Message;
import org.example.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    @Autowired
    private MessageService _messageService;

    @PostMapping("/send")
    private ResponseEntity<MessageDTO> sendMessage(@RequestBody MessageDTO message){
        _messageService.saveMessage(message);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/getfromChat")
    private ResponseEntity<List<MessageDTO>> getFromChat(@RequestParam String senderEmail, @RequestParam String receiverEmail){
        List<MessageDTO> list = _messageService.getFromChat(senderEmail, receiverEmail);
        return ResponseEntity.ok(list);
    }
}
