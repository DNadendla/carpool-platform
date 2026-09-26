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
        document.getElementById(
            "usersTableBody"
        );


    tableBody.innerHTML = "";


    users.forEach(
        function (user) {

            const row =
                document.createElement("tr");


            row.innerHTML =
                `
                <td>
                    ${user.id}
                </td>

                <td>
                    ${user.name}
                </td>

                <td>
                    ${user.email}
                </td>

                <td>
                    ${user.phone || "-"}
                </td>

                <td>

                    <button
                        class="action-button view-roles-button"
                        onclick="viewRoles(${user.id})"
                        title="View Roles">

                        👁

                    </button>


                    <a
                        href="/users/${user.id}/edit"
                        class="action-button edit-button"
                        title="Edit User">

                        ✏

                    </a>


                    <button
                        class="action-button delete-button"
                        onclick="deleteUser(${user.id})"
                        title="Delete User">

                        🗑

                    </button>

                </td>
                `;


            tableBody.appendChild(row);

        }
    );

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
                <p class="no-roles">
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
                        "role-chip";


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