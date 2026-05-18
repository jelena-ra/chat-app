package org.example.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

import org.example.model.enums.DisappearingStatus;

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

    private String clientId;

    private String content;
    private String signature;

    @Enumerated(EnumType.STRING)
    private DisappearingStatus disappearingStatus;
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
    @JoinColumn(name="receiver_id", nullable = true)
    private User receiver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = true)
    private Group group;

    @OneToMany(/*cascade = CascadeType.ALL, orphanRemoval = true*/)
    @JoinTable(
            name = "message_images",
            joinColumns = @JoinColumn(name = "message_id"),
            inverseJoinColumns = @JoinColumn(name = "image_id")
    )
    private List<Image> images = new ArrayList<>();

}
