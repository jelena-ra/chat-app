package org.example.model;

import org.example.model.enums.DisappearingStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface LastChatMessageProjection {
    String getClientId();
    String getContent();
    LocalDateTime getTimeSent();
    String getSenderEmail();
    String getReceiverEmail();
    boolean getRead();
    Long getGroupId();
    DisappearingStatus getDisappearingStatus();
    List<Long> getImageIds();
}
