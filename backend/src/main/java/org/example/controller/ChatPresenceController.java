package org.example.controller;

import org.example.dtos.ActiveChatDTO;
import org.example.dtos.ActiveGroupChatDTO;
import org.example.dtos.ReadUpdateDTO;
import org.example.service.GroupMessageStatusService;
import org.example.service.MessageService;
import org.example.service.presence.ActiveChatStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class ChatPresenceController {

    @Autowired
    private ActiveChatStore activeChatStore;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    @Autowired
    private GroupMessageStatusService groupMessageStatusService;

    @MessageMapping("/active-chat")
    public void setActiveChat(ActiveChatDTO dto){
        if(dto == null)return;
        System.out.println("ACTIVE CHAT: "+ dto.getUserEmail() + " with " + dto.getWithUser());
        activeChatStore.setActiveChat(dto.getUserEmail(),dto.getWithUser());
        List<String> updatedMessageIds = messageService.markAsReadAllInChat(dto.getUserEmail(),dto.getWithUser());
        if (!updatedMessageIds.isEmpty()) {
            System.out.println("IMA UNREAD MESSAGES KOJE MIJENJA");
            messagingTemplate.convertAndSendToUser(
                    dto.getWithUser(),
                    "/queue/read",
                    new ReadUpdateDTO("messages-read", updatedMessageIds)
            );
        }
    }

    @MessageMapping("/inactive-chat")
    public void clearActiveChat(String userEmail){
        if(userEmail.isBlank())return;
        System.out.println("CLEAR ACTIVITY FOR : "+ userEmail);
        activeChatStore.clearActiveChat(userEmail);
    }

    @MessageMapping("/active-group-chat")
    public void setActiveGroupChat(ActiveGroupChatDTO dto) {
        if (dto == null || dto.getUserEmail() == null || dto.getGroupId() == null) return;

        System.out.println("ACTIVE GROUP CHAT: " + dto.getUserEmail() + " in group " + dto.getGroupId());

        int updatedCount = groupMessageStatusService.markGroupAsRead(
                dto.getUserEmail(),
                dto.getGroupId()
        );

        System.out.println("GROUP READ UPDATED COUNT: " + updatedCount);
    }
}
