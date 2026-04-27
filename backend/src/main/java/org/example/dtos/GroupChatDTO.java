package org.example.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupChatDTO {

    private Long groupId;
    private String groupName;
    private String lastMessageContent;
    private String lastMessageTime;
    private String lastSenderEmail;
    private boolean lastMessageRead;
}
