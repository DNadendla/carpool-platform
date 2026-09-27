// ============================================================
// USERS PAGE
// ============================================================


// ------------------------------------------------------------
// Load users when page opens
// ------------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    loadUsers
);


// ============================================================
// LOAD USERS
// ============================================================

async function loadUsers() {

    try {

        const response =
            await API.get("/api/users");


        // API returns null after 401 and redirects to login
        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Failed to load users"
            );

        }


        const users =
            await response.json();


        displayUsers(users);


    } catch (error) {

        console.error(
            "Error loading users:",
            error
        );


        showMessage(
            "Unable to load users",
            "error"
        );

    }

}


// ============================================================
// DISPLAY USERS
// ============================================================

function displayUsers(users) {

    const tableBody =
        document.getElementById("usersTableBody");

    const usersCount =
        document.getElementById("usersCount");

    const emptyState =
        document.getElementById("usersEmptyState");


    tableBody.innerHTML = "";


    usersCount.textContent =
        users.length;


    if (!users || users.length === 0) {

        emptyState.classList.remove("hidden");

        return;
    }


    emptyState.classList.add("hidden");


    users.forEach(function (user) {

        const row =
            document.createElement("tr");


        const initials =
            getUserInitials(user.name);


        row.innerHTML = `
            <td>
                <span class="user-id-badge">
                    #${user.id}
                </span>
            </td>

            <td>

                <div class="user-cell">

                    <div class="user-avatar">
                        ${initials}
                    </div>

                    <div>

                        <span class="user-name">
                            ${user.name}
                        </span>

                        <span class="user-role-hint">
                            Carpool member
                        </span>

                    </div>

                </div>

            </td>

            <td>

                <span class="user-email">
                    ${user.email}
                </span>

            </td>

            <td>

                <span class="user-phone">
                    ${user.phone || "-"}
                </span>

            </td>

            <td>

                <div class="users-actions">

                    <button
                        class="users-action-button users-view-button"
                        onclick="viewRoles(${user.id})"
                        title="View Roles"
                        aria-label="View Roles">

                        👁

                    </button>


                    <a
                        href="/users/${user.id}/edit"
                        class="users-action-button users-edit-button"
                        title="Edit User"
                        aria-label="Edit User">

                        ✏

                    </a>


                    <button
                        class="users-action-button users-delete-button"
                        onclick="deleteUser(${user.id})"
                        title="Delete User"
                        aria-label="Delete User">

                        🗑

                    </button>

                </div>

            </td>
        `;


        tableBody.appendChild(row);

    });

}

function getUserInitials(name) {

    if (!name) {
        return "U";
    }


    const parts =
        name.trim().split(/\s+/);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0].charAt(0)
        + parts[parts.length - 1].charAt(0)
    ).toUpperCase();

}


// ============================================================
// VIEW USER ROLES
// ============================================================

async function viewRoles(userId) {

    try {

        const response =
            await API.get(
                `/api/users/${userId}`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load user"
            );

        }


        const user =
            await response.json();


        // ----------------------------------------------------
        // Set user name
        // ----------------------------------------------------

        document.getElementById(
            "modalUserName"
        ).textContent =
            user.name;


        // ----------------------------------------------------
        // Get roles container
        // ----------------------------------------------------

        const rolesContainer =
            document.getElementById(
                "modalRoles"
            );


        rolesContainer.innerHTML = "";


        // ----------------------------------------------------
        // No roles
        // ----------------------------------------------------

        if (
            !user.roles ||
            user.roles.length === 0
        ) {

            rolesContainer.innerHTML =
                `
                <p class="users-no-roles">
                    No roles assigned
                </p>
                `;

        }


        // ----------------------------------------------------
        // Display roles
        // ----------------------------------------------------

        else {

            user.roles.forEach(
                function (role) {

                    const roleChip =
                        document.createElement(
                            "span"
                        );


                    roleChip.className =
                        "users-role-chip";


                    roleChip.textContent =
                        role;


                    rolesContainer.appendChild(
                        roleChip
                    );

                }
            );

        }


        // ----------------------------------------------------
        // Show modal
        // ----------------------------------------------------

        document.getElementById(
            "rolesModal"
        ).classList.add("show");


    } catch (error) {

        console.error(
            "Error loading user roles:",
            error
        );


        showMessage(
            "Unable to load user roles",
            "error"
        );

    }

}


// ============================================================
// CLOSE MODAL
// ============================================================

document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeRolesModal
    );


document
    .getElementById("closeModalButton")
    .addEventListener(
        "click",
        closeRolesModal
    );


function closeRolesModal() {

    document
        .getElementById("rolesModal")
        .classList.remove("show");

}


// ------------------------------------------------------------
// Close modal when clicking outside
// ------------------------------------------------------------

document
    .getElementById("rolesModal")
    .addEventListener(
        "click",
        function (event) {

            if (
                event.target.id ===
                "rolesModal"
            ) {

                closeRolesModal();

            }

        }
    );


// ============================================================
// DELETE USER
// ============================================================

async function deleteUser(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this user?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await API.delete(
                `/api/users/${id}`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Failed to delete user"
            );

        }


        showMessage(
            "User deleted successfully",
            "success"
        );


        // Reload table
        loadUsers();


    } catch (error) {

        console.error(
            "Error deleting user:",
            error
        );


        showMessage(
            "Unable to delete user",
            "error"
        );

    }

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "message"
        );


    element.textContent =
        message;


    element.className =
        `message ${type}`;

}