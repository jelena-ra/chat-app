package org.example.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@AllArgsConstructor
public class TokensDTO {

    private String refreshToken;
    private String accessToken;

}
