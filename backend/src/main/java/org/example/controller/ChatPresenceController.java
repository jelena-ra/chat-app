package org.example.controller;

import org.example.dtos.ActiveChatDTO;
import org.example.service.presence.ActiveChatStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class ChatPresenceController {

    @Autowired
    private ActiveChatStore activeChatStore;

    @MessageMapping("/active-chat")
    public void setActiveChat(ActiveChatDTO dto){
        if(dto == null)return;
        System.out.println("ACTIVE CHAT: "+ dto.getUserEmail() + " with " + dto.getWithUser());
        activeChatStore.setActiveChat(dto.getUserEmail(),dto.getWithUser());
    }

    @MessageMapping("/inactive-chat")
    public void clearActiveChat(String userEmail){
        if(userEmail.isBlank())return;
        System.out.println("CLEAR ACTIVITY FOR : "+ userEmail);
        activeChatStore.clearActiveChat(userEmail);
    }
}
