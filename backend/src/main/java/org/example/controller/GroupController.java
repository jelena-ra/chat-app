package org.example.controller;

import org.example.dtos.AddMemberDTO;
import org.example.dtos.GroupResponseDTO;
import org.example.model.Group;
import org.example.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping("/create")
    public ResponseEntity<GroupResponseDTO> createGroup(@RequestBody Map<String, Object> body) {
        System.out.println("Usao u create group");
        String name = (String) body.get("name");
        String adminEmail = (String) body.get("adminEmail");

        List<String> memberEmails = (List<String>) body.get("memberEmails");

        GroupResponseDTO group = groupService.createGroup(name, adminEmail, memberEmails);
        return ResponseEntity.ok(group);
    }

    @PostMapping("/add-member")
    public ResponseEntity<GroupResponseDTO> addMember(@RequestBody AddMemberDTO dto) {
        GroupResponseDTO group = groupService.addMember(dto.getGroupId(),dto.getMemberEmail());
        return ResponseEntity.ok(group);
    }

    @GetMapping("/members")
    public ResponseEntity<List<String>> getMembers(@RequestParam Long groupId){
        System.out.println(">>> /groups/members called");
        List<String> memberEmails = groupService.getMembers(groupId);
        return ResponseEntity.ok(memberEmails);
    }
}
