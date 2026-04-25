package org.example.repository;

import org.example.model.Group;
import org.example.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    List<Group> findAllByMembersContainingOrAdmin(User member, User admin);

    @Query("SELECT g FROM Group g LEFT JOIN FETCH g.members WHERE g.id = :id")
    Optional<Group> findByIdWithMembers(Long id);

    @Query("""
    SELECT g FROM Group g
    LEFT JOIN FETCH g.members
    LEFT JOIN FETCH g.admin
    WHERE g.id = :id
""")
    Optional<Group> findByIdWithMembersAndAdmin(Long id);
}
