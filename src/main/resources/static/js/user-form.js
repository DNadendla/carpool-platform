// ============================================================
// User Form
// Handles:
// CREATE -> POST /api/users
// EDIT   -> GET /api/users/{id}
// EDIT   -> PUT /api/users/{id}
// ============================================================


// ------------------------------------------------------------
// HTML elements
// ------------------------------------------------------------

const userForm =
    document.getElementById("userForm");

const roleDropdown =
    document.getElementById("roleDropdown");

const roleSelectBox =
    document.getElementById("roleSelectBox");

const roleOptions =
    document.getElementById("roleOptions");

const selectedRolesContainer =
    document.getElementById("selectedRoles");


// ------------------------------------------------------------
// Determine whether this is CREATE or EDIT
// ------------------------------------------------------------

const pathParts =
    window.location.pathname.split("/");


// Example:
//
// /users/new
//
// OR
//
// /users/5/edit


let userId = null;


if (
    pathParts.length >= 4 &&
    pathParts[pathParts.length - 1] === "edit"
) {

    userId =
        pathParts[pathParts.length - 2];

}


// ------------------------------------------------------------
// Page initialization
// ------------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (userId) {

            loadUser(userId);

        }

    }
);


// ------------------------------------------------------------
// Role dropdown
// ------------------------------------------------------------

roleSelectBox.addEventListener(
    "click",
    function () {

        roleOptions.classList.toggle("open");

    }
);


// ------------------------------------------------------------
// Role checkboxes
// ------------------------------------------------------------

const roleCheckboxes =
    roleOptions.querySelectorAll(
        'input[type="checkbox"]'
    );


roleCheckboxes.forEach(
    function (checkbox) {

        checkbox.addEventListener(
            "change",
            updateSelectedRoles
        );

    }
);


// ------------------------------------------------------------
// Display selected roles
// ------------------------------------------------------------

function updateSelectedRoles() {

    const selectedCheckboxes =
        roleOptions.querySelectorAll(
            'input[type="checkbox"]:checked'
        );


    selectedRolesContainer.innerHTML = "";


    if (selectedCheckboxes.length === 0) {

        selectedRolesContainer.innerHTML =
            `
            <span class="placeholder">
                Select roles
            </span>
            `;

        return;
    }


    selectedCheckboxes.forEach(
        function (checkbox) {

            const chip =
                document.createElement("span");

            chip.className =
                "role-chip";


            chip.innerHTML =
                `
                ${checkbox.value}
                <span class="remove-role">
                    ×
                </span>
                `;


            chip
                .querySelector(".remove-role")
                .addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        checkbox.checked = false;

                        updateSelectedRoles();

                    }
                );


            selectedRolesContainer.appendChild(
                chip
            );

        }
    );
}


// ------------------------------------------------------------
// Close dropdown when clicking outside
// ------------------------------------------------------------

document.addEventListener(
    "click",
    function (event) {

        if (
            !roleDropdown.contains(
                event.target
            )
        ) {

            roleOptions.classList.remove(
                "open"
            );

        }

    }
);


// ------------------------------------------------------------
// Load existing user for EDIT
// ------------------------------------------------------------

async function loadUser(id) {

    try {

        const response = await API.get(`/api/users/${id}`);


        if (!response.ok) {

            throw new Error(
                "Unable to load user"
            );

        }


        const user =
            await response.json();


        // Populate form fields

        document.getElementById(
            "userId"
        ).value =
            user.id;


        document.getElementById(
            "name"
        ).value =
            user.name;


        document.getElementById(
            "email"
        ).value =
            user.email;


        document.getElementById(
            "phone"
        ).value =
            user.phone || "";


        // ----------------------------------------------------
        // Password
        // ----------------------------------------------------
        //
        // We normally should NOT load the existing password.
        //
        // Leave password empty during edit.
        //
        // Your backend should ideally support updating
        // password separately.
        // ----------------------------------------------------


        document.getElementById(
            "password"
        ).value = "";


        // ----------------------------------------------------
        // Load roles
        // ----------------------------------------------------

        selectUserRoles(
            user.roles
        );


        // Change page title

        const formTitle =
            document.getElementById(
                "formTitle"
            );


        if (formTitle) {

            formTitle.textContent =
                "Edit User";

        }


    } catch (error) {

        console.error(
            "Error loading user:",
            error
        );


        alert(
            "Unable to load user details."
        );

    }
}


// ------------------------------------------------------------
// Select roles for existing user
// ------------------------------------------------------------

function selectUserRoles(roles) {

    if (!roles) {
        return;
    }


    roles.forEach(
        function (role) {

            // UserResponse might return:
            //
            // ["USER", "DRIVER"]
            //
            // OR:
            //
            // [{name:"USER"}, {name:"DRIVER"}]

            const roleName =
                typeof role === "string"
                    ? role
                    : role.name;


            roleCheckboxes.forEach(
                function (checkbox) {

                    if (
                        checkbox.value ===
                        roleName
                    ) {

                        checkbox.checked = true;

                    }

                }
            );

        }
    );


    updateSelectedRoles();
}


// ------------------------------------------------------------
// Submit form
// ------------------------------------------------------------

userForm.addEventListener(
    "submit",
    saveUser
);


// ------------------------------------------------------------
// Create / Update user
// ------------------------------------------------------------

async function saveUser(event) {

    event.preventDefault();


    const selectedRoles =
        Array.from(
            roleOptions.querySelectorAll(
                'input[type="checkbox"]:checked'
            )
        ).map(
            function (checkbox) {

                return checkbox.value;

            }
        );


    const user = {

        name:
            document.getElementById(
                "name"
            ).value,

        email:
            document.getElementById(
                "email"
            ).value,

        password:
            document.getElementById(
                "password"
            ).value,

        phone:
            document.getElementById(
                "phone"
            ).value,

        roles:
            selectedRoles

    };


    try {

        let url =
            "/api/users";

        let method =
            "POST";


        // EDIT

        if (userId) {

            url =
                `/api/users/${userId}`;

            method =
                "PUT";

        }


        /*const response =
            await fetch(
                url,
                {

                    method:
                        method,

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(user)

                }
            );*/

        let response;

        if (userId) {

            response = await API.put(
                `/api/users/${userId}`,
                user
            );

        } else {

            response = await API.post(
                "/api/users",
                user
            );
        }

        if (!response) {
            return;
        }


        if (!response.ok) {

            const error =
                await response.json();


            console.error(
                "API Error:",
                error
            );


            if (
                typeof handleValidationErrors ===
                "function"
            ) {

                handleValidationErrors(
                    error
                );

            } else {

                alert(
                    error.message ||
                    "Unable to save user"
                );

            }

            return;
        }


        // Success

        window.location.href =
            "/users";


    } catch (error) {

        console.error(
            "Error saving user:",
            error
        );


        alert(
            "Something went wrong while saving the user."
        );

    }

}