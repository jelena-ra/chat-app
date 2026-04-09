package org.example.service;

import org.example.dtos.PublicKeysDTO;
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
        if(_userRepository.findByEmail(userDto.getEmail()).isPresent()) throw new  RuntimeException(" User already exists");
        User user = new User(userDto.getEmail(), userDto.getNumber());
        _userRepository.save(user);
    }

    public void verify(String email){
        User user = _userRepository.findByEmail(email).orElseThrow(()-> new RuntimeException(" User not found"));
        user.setVerified(true);
        user.setProfile(new UserProfile("","",null, new Image()));
        _userRepository.save(user);
    }
    public void savePublicKey (String email, String publicKeySigning , String publicKeyEncrypting){
        User user = _userRepository.findByEmail(email).orElseThrow(()-> new RuntimeException(" User not found"));
        user.setPublicKeySigning(publicKeySigning);
        user.setPublicKeyEncryption(publicKeyEncrypting);
        _userRepository.save(user);
    }
    public User getByEmail(String email){
        return _userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
    public User getById(Long id){
        return _userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public PublicKeysDTO getPublicKeys(String email){
        String publicKeySigning =  getByEmail(email).getPublicKeySigning();
        String publicKeyEncryption = getByEmail(email).getPublicKeyEncryption();
        return new PublicKeysDTO(email,publicKeySigning,publicKeyEncryption);
    }


}
