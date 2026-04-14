package org.example.service.presence;

public interface ActiveChatStore {

    void setActiveChat(String userEmail, String withUserEmail);
    void clearActiveChat(String userEmail);
    String getActiveChat(String userEmail);
    boolean isUserActiveInChatWith(String userEmail, String withUserEmail);
}
