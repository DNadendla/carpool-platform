package com.carpool.user.service;

import com.carpool.user.dto.UserRequest;
import com.carpool.user.dto.UserResponse;
import com.carpool.user.entity.Role;
import com.carpool.user.entity.User;
import com.carpool.user.repository.RoleRepository;
import com.carpool.user.repository.UserRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;

  private final PasswordEncoder passwordEncoder;

  /*public static void main(String[] args) {
      String encode = new BCryptPasswordEncoder().encode("dspnadendla@gmail.com");
      System.out.println(encode);
  }*/

  public UserService(
      UserRepository userRepository,
      RoleRepository roleRepository,
      PasswordEncoder passwordEncoder) {

    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public UserResponse createUser(UserRequest request) {

    // 1. Check duplicate email
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new RuntimeException("Email already registered");
    }

    // 2. Convert request → entity
    User user =
        User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .phone(request.getPhone())
            .build();

    // 3. Resolve roles
    Set<Role> roles = resolveRoles(request.getRoles());

    user.setRoles(roles);

    // 4. Save user
    User savedUser = userRepository.save(user);

    // 5. Convert entity → response DTO
    return mapToResponse(savedUser);
  }

  @Transactional(readOnly = true)
  public List<UserResponse> getAllUsers() {

    return userRepository.findAll().stream().map(this::mapToResponse).toList();
  }

  @Transactional(readOnly = true)
  public UserResponse getUserById(Long id) {

    User user =
        userRepository
            .findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

    return mapToResponse(user);
  }

  public UserResponse updateUser(Long id, UserRequest request) {

    User existingUser =
        userRepository
            .findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

    existingUser.setName(request.getName());
    existingUser.setPhone(request.getPhone());

    if (request.getRoles() != null) {
      existingUser.setRoles(resolveRoles(request.getRoles()));
    }

    User updatedUser = userRepository.save(existingUser);

    return mapToResponse(updatedUser);
  }

  public void deleteUser(Long id) {

    if (!userRepository.existsById(id)) {
      throw new RuntimeException("User not found with id: " + id);
    }

    userRepository.deleteById(id);
  }

  private Set<Role> resolveRoles(Set<String> roleNames) {

    Set<Role> roles = new HashSet<>();

    if (roleNames == null || roleNames.isEmpty()) {
      roles.add(roleRepository.findByName("PASSENGER").get());
      return roles;
    }

    for (String roleName : roleNames) {

      Role role =
          roleRepository
              .findByName(roleName)
              .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

      roles.add(role);
    }

    return roles;
  }

  private UserResponse mapToResponse(User user) {

    Set<String> roleNames =
        user.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.toSet());

    return UserResponse.builder()
        .id(user.getId())
        .name(user.getName())
        .email(user.getEmail())
        .phone(user.getPhone())
        .roles(roleNames)
        .build();
  }
}
