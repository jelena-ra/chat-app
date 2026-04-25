package org.example.service;

import org.example.model.Group;
import org.example.model.GroupMessageStatus;
import org.example.model.Message;
import org.example.model.User;
import org.example.repository.GroupMessageStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class GroupMessageStatusService {

    @Autowired
    private GroupMessageStatusRepository groupMessageStatusRepository;

    @Autowired
    private GroupService groupService;

    @Transactional
    public void createStatusesForGroupMessage(Message message) {
        Group group = groupService.getByIdWithMembersAndAdmin(message.getGroup().getId());

        for (User member : group.getMembers()) {
            boolean isSender = member.getEmail().equals(message.getSender().getEmail());

            GroupMessageStatus status = new GroupMessageStatus(
                    message,
                    member,
                    isSender
            );

            groupMessageStatusRepository.save(status);
        }

        if (group.getAdmin() != null) {
            boolean adminAlreadyInMembers = group.getMembers().stream()
                    .anyMatch(member -> member.getEmail().equals(group.getAdmin().getEmail()));

            if (!adminAlreadyInMembers) {
                boolean isSender = group.getAdmin().getEmail().equals(message.getSender().getEmail());

                GroupMessageStatus status = new GroupMessageStatus(
                        message,
                        group.getAdmin(),
                        isSender
                );

                groupMessageStatusRepository.save(status);
            }
        }
    }

    @Transactional
    public int markGroupAsRead(String email, Long groupId) {
        return groupMessageStatusRepository.markGroupMessagesAsRead(
                email,
                groupId
        );
    }

    public boolean hasUnreadMessages(String email, Long groupId) {
        return groupMessageStatusRepository
                .existsByUser_EmailAndMessage_Group_IdAndReadFalse(email, groupId);
    }

    public boolean isMessageUnreadForUser(String email, Long messageId) {
        return groupMessageStatusRepository
                .existsByUser_EmailAndMessage_IdAndReadFalse(email, messageId);
    }
}