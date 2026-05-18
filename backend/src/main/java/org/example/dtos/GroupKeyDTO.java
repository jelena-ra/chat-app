package org.example.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class GroupKeyDTO {
    private Long groupId;
    private String userEmail;
    private String encryptedGroupKey;
    private String adminPublicEncryptingKey;
}
