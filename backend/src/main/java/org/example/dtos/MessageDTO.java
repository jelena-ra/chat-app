package org.example.dtos;

import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.model.Image;
import org.example.model.Message;
import org.example.model.User;
import org.example.model.enums.DisappearingStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageDTO {

    private String clientId;
    private String content;
    private String signature;
    private DisappearingStatus disappearingStatus;
    private LocalDateTime timeSent;

   /* @ManyToOne
    @JoinColumn(nullable=true)
    private Group group;*/

    private String senderEmail;
    private String receiverEmail;
    private boolean isRead;
    private Long groupId;
    private List<Long> imageIds;

    public MessageDTO(Message message){
        this.clientId= message.getClientId();
        this.content= message.getContent();
        this.disappearingStatus = message.getDisappearingStatus();
        this.timeSent=message.getTimeSent();
        this.senderEmail=message.getSender().getEmail();
        this.receiverEmail = message.getReceiver() != null
                ? message.getReceiver().getEmail()
                : null;
        this.signature = message.getSignature();
        this.isRead = message.isRead();
        if(message.getGroup() != null){
        this.groupId = message.getGroup().getId();}else{
            this.groupId=null;
        }
        this.imageIds = message.getImages() == null
                ? new ArrayList<>()
                : message.getImages()
                .stream()
                .map(Image::getId)
                .toList();
    }
}
