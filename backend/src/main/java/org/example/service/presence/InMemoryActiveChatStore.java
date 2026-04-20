package org.example.service.presence;


import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class InMemoryActiveChatStore implements  ActiveChatStore{

    private final Map<String, String> activeChats = new ConcurrentHashMap<>();
    @Override
    public void setActiveChat(String userEmail, String withUserEmail) {
        if(userEmail == null || withUserEmail ==null) return;
        activeChats.put(userEmail,withUserEmail);
    }

    @Override
    public void clearActiveChat(String userEmail) {
        if(userEmail == null) return;
        activeChats.remove(userEmail);

    }

    @Override
    public String getActiveChat(String userEmail) {
        if(userEmail == null) return null;
        return activeChats.get(userEmail);
    }

    @Override
    public boolean isUserActiveInChatWith(String userEmail, String withUserEmail) {
        if (userEmail == null || withUserEmail == null) return false;
        return withUserEmail.equals(activeChats.get(userEmail));
    }
}
