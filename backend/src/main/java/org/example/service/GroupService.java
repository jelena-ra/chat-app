package org.example.service;

import org.example.dtos.GroupChatDTO;
import org.example.model.Group;
import org.example.model.User;
import org.example.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GroupService {

    @Autowired
    private GroupRepository _groupRepository;

    @Autowired
    private UserService userService;

    public Group getById(Long id){
        return _groupRepository.findById(id).orElse(null);
    }

    public boolean isUserMember(Long groupId, String email) {
        Group group =getByIdWithMembers(groupId);

        boolean isMember = group.getMembers().stream()
                .anyMatch(member -> member.getEmail().equals(email));

        boolean isAdmin = group.getAdmin() != null &&
                group.getAdmin().getEmail().equals(email);

        return isMember || isAdmin;
    }
    public Group getByIdWithMembersAndAdmin(Long id) {
        return _groupRepository
                .findByIdWithMembersAndAdmin(id)
                .orElse(null);
    }
    public Group getByIdWithMembers(Long id){
        return _groupRepository.findByIdWithMembers(id).orElse(null);
    }

    public List<Group> getMyGroups(String email) {
        User user = userService.getByEmail(email);
        return _groupRepository.findAllByMembersContainingOrAdmin(user, user);
    }

    public Group addMember(Long groupId, String email) {
        Group group = getById(groupId);
        User user = userService.getByEmail(email);

        boolean alreadyExists = group.getMembers().stream()
                .anyMatch(member -> member.getEmail().equals(email));

        if (!alreadyExists) {
            group.getMembers().add(user);
        }

        return _groupRepository.save(group);
    }

    public Group removeMember(Long groupId, String email) {
        Group group = getById(groupId);

        group.getMembers().removeIf(member -> member.getEmail().equals(email));
        return _groupRepository.save(group);
    }
    public Group createGroup(String name, String adminEmail, List<String> memberEmails) {
        User admin = userService.getByEmail(adminEmail);

        Group group = new Group();
        group.setName(name);
        group.setAdmin(admin);

        List<User> members = new ArrayList<>();

        if (memberEmails != null) {
            for (String memberEmail : memberEmails) {
                User user = userService.getByEmail(memberEmail);

                boolean alreadyAdded = members.stream()
                        .anyMatch(m -> m.getEmail().equals(user.getEmail()));

                if (!alreadyAdded) {
                    members.add(user);
                }
            }
        }

        boolean adminAlreadyAdded = members.stream()
                .anyMatch(m -> m.getEmail().equals(admin.getEmail()));

        if (!adminAlreadyAdded) {
            members.add(admin);
        }

        group.setMembers(members);

        return _groupRepository.save(group);
    }

}
