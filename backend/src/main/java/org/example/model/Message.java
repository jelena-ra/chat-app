package org.example.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;
    private String signature;
    private boolean isDisappearing;
    private boolean isReceived;
    private boolean isDeletedBySender;
    private boolean isRead;
    private LocalDateTime timeSent;


   /* @ManyToOne
    @JoinColumn(nullable=true)
    private Group group;*/

    @ManyToOne
    @JoinColumn(name="sender_id")
    private User sender;


    @ManyToOne
    @JoinColumn(name="receiver_id")
    private User receiver;


}
