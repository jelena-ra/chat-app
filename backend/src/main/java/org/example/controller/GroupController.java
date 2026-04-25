package org.example.controller;

import org.example.model.Group;
import org.example.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping("/create")
    public ResponseEntity<Group> createGroup(@RequestBody Map<String, Object> body) {
        System.out.println("Usao u create group");
        String name = (String) body.get("name");
        String adminEmail = (String) body.get("adminEmail");

        List<String> memberEmails = (List<String>) body.get("memberEmails");

        Group group = groupService.createGroup(name, adminEmail, memberEmails);
        return ResponseEntity.ok(group);
    }
}
