package org.example.dtos;

import lombok.*;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class InviteDTO {

    private String fromEmail;
    private String toEMail;
}
