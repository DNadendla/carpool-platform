package com.carpool.user.dto;

import java.util.Set;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

  private Long id;

  private String name;

  private String email;

  private String phone;

  private Set<String> roles;
}
