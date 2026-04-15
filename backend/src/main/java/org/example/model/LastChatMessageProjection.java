package org.example.model;

import java.time.LocalDateTime;

public interface LastChatMessageProjection {
    String getContent();
    LocalDateTime getTimeSent();
    String getSenderEmail();
    String getReceiverEmail();
}
