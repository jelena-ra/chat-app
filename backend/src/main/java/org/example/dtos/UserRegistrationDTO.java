package org.example.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserRegistrationDTO{

    @NotBlank(message = "You must enter an email")
    @Email(message = "Email has to be in valid format")
    private String email;

    @NotBlank(message = "You must enter a phone number")
    @Pattern(regexp = "^(\\+381|0)6[0-9]{8,9}$", message = "Number has to be in valid format")
    private String number;

}
