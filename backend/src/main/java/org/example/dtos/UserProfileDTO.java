package org.example.dtos;

import jakarta.persistence.CascadeType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.model.Image;
import org.example.model.UserProfile;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class UserProfileDTO {

    private String email;
    private String name;
    private String surname;
    private LocalDate birthdate;


    public UserProfileDTO(String email, UserProfile profile){
        this.email = email;
        this.name = profile.getName();
        this.surname = profile.getSurname();
        this.birthdate = profile.getBirthdate();
    }

}
