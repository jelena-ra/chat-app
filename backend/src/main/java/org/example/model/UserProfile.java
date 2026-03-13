package org.example.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String surname;
    private LocalDate birthdate;

    @OneToOne(
            cascade = {CascadeType.ALL},
            orphanRemoval = true
    )
    @JoinColumn(
            name = "image_id",
            referencedColumnName = "id"
    )
    private Image image;



    public UserProfile(String name, String surname,  LocalDate date, Image image){
       this.name=name;
       this.surname=surname;
       birthdate =  date;
       this.image = image;
    }
}
