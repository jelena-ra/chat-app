package org.example.controller;

import org.example.dtos.GroupChatDTO;
import org.example.dtos.GroupKeyDTO;
import org.example.model.GroupKey;
import org.example.service.GroupKeyService;
import org.example.service.GroupService;
import org.example.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/group-keys")
public class GroupKeyController {

    @Autowired
    private GroupKeyService groupKeyService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private GroupService groupService;

    @PostMapping("/save-all")
    public ResponseEntity<String> saveAll(@RequestBody List<GroupKeyDTO> keys) {
        groupKeyService.saveAll(keys);
        return ResponseEntity.ok("Group keys saved");
    }


    @GetMapping("/my-key")
    public ResponseEntity<GroupKeyDTO> getMyKey(@RequestParam Long groupId,
                                                @RequestParam String email) {
        if (!groupService.isUserMember(groupId, email)) {
            return ResponseEntity.status(403).build();
        }

        GroupKey gk = groupKeyService.getByGroupAndUser(groupId, email);
        return ResponseEntity.ok(
                new GroupKeyDTO(
                        gk.getGroup().getId(),
                        gk.getUser().getEmail(),
                        gk.getEncryptedGroupKey(),
                        gk.getGroup().getAdmin().getPublicKeyEncryption()
                )
        );
    }
}