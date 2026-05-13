package org.example.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "users")
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String number;

    @Column(unique = true)
    private String email;

    private boolean online;

    private boolean verified;

    private String publicKeyEncryption;
    private String publicKeySigning;


    @OneToMany(
            mappedBy = "owner",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<Contact> contacts = new ArrayList<>();


    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    private UserProfile profile;



    public User(String email, String number ){
        this.number = number;
        this.email=email;
        this.online = false;
        this.publicKeyEncryption = "";
        this.publicKeySigning = "";
        this.verified = false;
        this.profile = null;
    }
}
