package org.example.dtos;

import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.model.Message;
import org.example.model.User;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageDTO {

    private String clientId;
    private String content;
    private String signature;
    private boolean isDisappearing;
    private LocalDateTime timeSent;

   /* @ManyToOne
    @JoinColumn(nullable=true)
    private Group group;*/

    private String senderEmail;
    private String receiverEmail;
    private boolean isRead;

    public MessageDTO(Message message){
        this.clientId= message.getClientId();
        this.content= message.getContent();
        this.isDisappearing = message.isDisappearing();
        this.timeSent=message.getTimeSent();
        this.senderEmail=message.getSender().getEmail();
        this.receiverEmail=message.getReceiver().getEmail();
        this.signature = message.getSignature();
        this.isRead = message.isRead();
    }
}
