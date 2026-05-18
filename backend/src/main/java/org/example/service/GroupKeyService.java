package org.example.service;

import org.example.dtos.GroupKeyDTO;
import org.example.model.Group;
import org.example.model.GroupKey;
import org.example.model.User;
import org.example.repository.GroupKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GroupKeyService {

    @Autowired
    private GroupKeyRepository groupKeyRepository;

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserService userService;

    public GroupKey save(GroupKeyDTO dto) {
        Group group = groupService.getById(dto.getGroupId());
        User user = userService.getByEmail(dto.getUserEmail());

        GroupKey existing = groupKeyRepository
                .findByGroup_IdAndUser_Email(dto.getGroupId(), dto.getUserEmail())
                .orElse(null);

        if (existing != null) {
            existing.setEncryptedGroupKey(dto.getEncryptedGroupKey());
            return groupKeyRepository.save(existing);
        }

        GroupKey groupKey = new GroupKey(null, group, user, dto.getEncryptedGroupKey());
        return groupKeyRepository.save(groupKey);
    }

    public void saveAll(List<GroupKeyDTO> keys) {
        for (GroupKeyDTO dto : keys) {
            save(dto);
        }
    }

    public GroupKey getByGroupAndUser(Long groupId, String email) {
        return groupKeyRepository.findByGroup_IdAndUser_Email(groupId, email)
                .orElseThrow(() -> new RuntimeException("Group key not found"));
    }

    public List<GroupKey> getAllForGroup(Long groupId) {
        return groupKeyRepository.findAllByGroup_Id(groupId);
    }

    public void deleteAllForGroup(Long groupId) {
        groupKeyRepository.deleteAllByGroup_Id(groupId);
    }
}