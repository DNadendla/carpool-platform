// ============================================================
// User Details Page
// ============================================================


// Get user ID from URL
// Example:
// /users/5
// userId = 5

const pathParts =
    window.location.pathname.split("/");

const userId =
    pathParts[pathParts.length - 1];


// ------------------------------------------------------------
// Load User
// ------------------------------------------------------------

async function loadUser() {

    try {

        const response =
            await fetch(`/api/users/${userId}`);


        if (!response.ok) {

            throw new Error(
                "Unable to load user"
            );

        }


        const user =
            await response.json();


        displayUser(user);


    } catch (error) {

        console.error(
            "Error loading user:",
            error
        );

        document.getElementById(
            "userDetails"
        ).innerHTML =
            `
            <p class="error-message">
                Unable to load user details.
            </p>
            `;

    }
}


// ------------------------------------------------------------
// Display User
// ------------------------------------------------------------

function displayUser(user) {

    document.getElementById(
        "userId"
    ).textContent =
        user.id;


    document.getElementById(
        "userName"
    ).textContent =
        user.name;


    document.getElementById(
        "userEmail"
    ).textContent =
        user.email;


    document.getElementById(
        "userPhone"
    ).textContent =
        user.phone || "-";


    // Edit button
    document.getElementById(
        "editUserButton"
    ).href =
        `/users/${user.id}/edit`;


    // Roles
    const roles =
        user.roles || [];


    const rolesContainer =
        document.getElementById(
            "userRoles"
        );


    rolesContainer.innerHTML = "";


    if (roles.length === 0) {

        rolesContainer.textContent =
            "No roles assigned";

        return;
    }


    roles.forEach(
        function (role) {

            const roleElement =
                document.createElement("span");

            roleElement.className =
                "role-chip";

            roleElement.textContent =
                typeof role === "string"
                    ? role
                    : role.name;

            rolesContainer.appendChild(
                roleElement
            );

        }
    );
}

/*function displayUser(user) {

    document.getElementById(
        "userName"
    ).textContent =
        user.name;


    document.getElementById(
        "userEmail"
    ).textContent =
        user.email;


    document.getElementById(
        "userPhone"
    ).textContent =
        user.phone || "-";


    // Display roles
    const roles =
        user.roles || [];


    const rolesContainer =
        document.getElementById(
            "userRoles"
        );


    rolesContainer.innerHTML = "";


    if (roles.length === 0) {

        rolesContainer.textContent =
            "No roles assigned";

        return;

    }


    roles.forEach(
        function (role) {

            const roleElement =
                document.createElement("span");

            roleElement.className =
                "role-chip";

            // UserResponse may return Role objects
            // or role strings depending on your DTO
            roleElement.textContent =
                typeof role === "string"
                    ? role
                    : role.name;

            rolesContainer.appendChild(
                roleElement
            );

        }
    );

}*/


// ------------------------------------------------------------
// Load user when page opens
// ------------------------------------------------------------

loadUser();