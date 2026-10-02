package com.carpool.security.service;

import com.carpool.security.CustomUserDetails;
import com.carpool.user.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {

  public User getCurrentUser() {

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {

      throw new IllegalStateException("No authenticated user found");
    }

    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

    return userDetails.getUser();
  }

  public Long getCurrentUserId() {
    return getCurrentUser().getId();
  }
}
