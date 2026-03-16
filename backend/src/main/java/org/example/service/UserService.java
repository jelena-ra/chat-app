package org.example.service;

import org.example.dtos.UserRegistrationDTO;
import org.example.model.Image;
import org.example.model.User;
import org.example.model.UserProfile;
import org.example.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private final UserRepository _userRepository;

    public UserService(UserRepository userRepository){
        this._userRepository = userRepository;
    }

    public void GenerateNewUser(UserRegistrationDTO userDto){
        User user = new User(userDto.getEmail(), userDto.getNumber());
        _userRepository.save(user);
    }

    public void verify(String email){
        User user = _userRepository.findByEmail(email).orElseThrow(()-> new RuntimeException(" User not found"));
        user.setVerified(true);
        user.setProfile(new UserProfile("","",null, new Image()));
        _userRepository.save(user);
    }
    public User getByEmail(String email){
        return _userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
    public User getById(Long id){
        return _userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

}
