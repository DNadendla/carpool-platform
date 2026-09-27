package com.carpool.config;

import com.carpool.user.entity.Permission;
import com.carpool.user.entity.Role;
import com.carpool.user.repository.PermissionRepository;
import com.carpool.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {

        // Permissions
        Permission userRead = createPermission("USER_READ");
        Permission userUpdate = createPermission("USER_UPDATE");

        Permission rideCreate = createPermission("RIDE_CREATE");
        Permission rideUpdate = createPermission("RIDE_UPDATE");
        Permission rideCancel = createPermission("RIDE_CANCEL");
        Permission rideSearch = createPermission("RIDE_SEARCH");

        Permission vehicleCreate = createPermission("VEHICLE_CREATE");
        Permission vehicleUpdate = createPermission("VEHICLE_UPDATE");
        Permission vehicleDelete = createPermission("VEHICLE_DELETE");

        Permission bookingCreate = createPermission("BOOKING_CREATE");
        Permission bookingCancel = createPermission("BOOKING_CANCEL");
        Permission bookingApprove = createPermission("BOOKING_APPROVE");

        // Roles

        createRole("DRIVER", Set.of(rideCreate, rideUpdate, rideCancel, rideSearch, vehicleCreate, vehicleUpdate, vehicleDelete, bookingApprove));

        createRole("PASSENGER", Set.of(rideSearch, bookingCreate, bookingCancel));

        createRole("ADMIN", Set.of(userRead, userUpdate, rideCreate, rideUpdate, rideCancel, rideSearch, vehicleCreate, vehicleUpdate, vehicleDelete, bookingCreate, bookingCancel, bookingApprove));
    }

    private Permission createPermission(String name) {

        return permissionRepository.findByName(name).orElseGet(() -> permissionRepository.save(Permission.builder().name(name).build()));
    }

    private Role createRole(String name, Set<Permission> permissions) {

        Role role = roleRepository.findByName(name).orElseGet(() -> Role.builder().name(name).build());

        role.setPermissions(permissions);

        return roleRepository.save(role);
    }
}