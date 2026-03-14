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

    public User GenerateNewUser(UserRegistrationDTO userDto){
        User user = new User(userDto.getEmail(), userDto.getNumber());
        return _userRepository.save(user);
    }

    public User verify(String email){
        User user = _userRepository.findByEmail(email);
        user.setVerified(true);
        user.setProfile(new UserProfile("","",null, new Image()));
        return  _userRepository.save(user);
    }

    public User generateUserProfile(Long userID,UserProfile userProfile){
        User user = _userRepository.findById(userID) .orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfile(userProfile);
        return  _userRepository.save(user);

    }

    public User register(String email, String number){
        return _userRepository.save(new User(email, number));
    }

}
