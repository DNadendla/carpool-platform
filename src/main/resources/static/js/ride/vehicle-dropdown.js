function getVehicleIcon(type) {

    const vehicleType =
        String(type || "")
            .toLowerCase()
            .trim();


    // =====================================================
    // SUV
    // Tall / boxy SUV silhouette
    // =====================================================

    if (vehicleType.includes("suv")) {

        return `
            <svg
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true">

                <!-- SUV body -->
                <path
                    d="M7 28
                       L10 17
                       C10.7 14.5 12.8 13 15.5 13
                       H32.5
                       C35.2 13 37.3 14.5 38 17
                       L41 28
                       V35
                       C41 36.7 39.7 38 38 38
                       H10
                       C8.3 38 7 36.7 7 35
                       Z"
                    fill="currentColor"/>

                <!-- SUV windows -->
                <path
                    d="M14 17
                       H33
                       L36 25
                       H12
                       Z"
                    fill="#ffffff"/>

                <!-- center divider -->
                <path
                    d="M24 17
                       V25"
                    stroke="currentColor"
                    stroke-width="2"/>

                <!-- wheels -->
                <circle
                    cx="14"
                    cy="34"
                    r="3.5"
                    fill="#ffffff"/>

                <circle
                    cx="34"
                    cy="34"
                    r="3.5"
                    fill="#ffffff"/>

                <!-- roof rail -->
                <path
                    d="M15 11
                       H33"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"/>

            </svg>
        `;
    }


    // =====================================================
    // SEDAN
    // Low / sleek sedan silhouette
    // =====================================================

    if (vehicleType.includes("sedan")) {

        return `
            <svg
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true">

                <!-- Sedan body -->
                <path
                    d="M8 29
                       L12 23
                       L16 18
                       C17 16.7 18.5 16 20 16
                       H29
                       C30.8 16 32.5 16.8 33.5 18.2
                       L37 23
                       L40 29
                       V34
                       C40 35.7 38.7 37 37 37
                       H11
                       C9.3 37 8 35.7 8 34
                       Z"
                    fill="currentColor"/>

                <!-- Sedan windows -->
                <path
                    d="M17 22
                       L19.5 18.5
                       H28.5
                       L32 22
                       Z"
                    fill="#ffffff"/>

                <!-- center divider -->
                <path
                    d="M24 18.5
                       V22"
                    stroke="currentColor"
                    stroke-width="2"/>

                <!-- wheels -->
                <circle
                    cx="14"
                    cy="33"
                    r="3.2"
                    fill="#ffffff"/>

                <circle
                    cx="34"
                    cy="33"
                    r="3.2"
                    fill="#ffffff"/>

            </svg>
        `;
    }


    // =====================================================
    // HATCHBACK
    // Compact / short rear
    // =====================================================

    if (vehicleType.includes("hatchback")) {

        return `
            <svg
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true">

                <!-- Hatchback -->
                <path
                    d="M8 29
                       L12 22
                       L16 18
                       C17.2 16.8 18.5 16
                       H27
                       C29 16 30.5 17
                       L36 23
                       L40 29
                       V34
                       C40 35.7 38.7 37 37 37
                       H11
                       C9.3 37 8 35.7 8 34
                       Z"
                    fill="currentColor"/>

                <!-- Windows -->
                <path
                    d="M17 22
                       L19 18.5
                       H26.5
                       L32 23
                       H17
                       Z"
                    fill="#ffffff"/>

                <!-- wheels -->
                <circle
                    cx="14"
                    cy="33"
                    r="3.2"
                    fill="#ffffff"/>

                <circle
                    cx="34"
                    cy="33"
                    r="3.2"
                    fill="#ffffff"/>

            </svg>
        `;
    }


    // =====================================================
    // VAN / MPV
    // Tall rectangular cabin
    // =====================================================

    if (
        vehicleType.includes("van") ||
        vehicleType.includes("mpv")
    ) {

        return `
            <svg
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true">

                <!-- Van body -->
                <path
                    d="M7 17
                       C7 14.8 8.8 13 11 13
                       H31
                       C33 13 34.5 14
                       35.5 15.5
                       L41 24
                       V35
                       C41 36.7 39.7 38 38 38
                       H10
                       C8.3 38 7 36.7 7 35
                       Z"
                    fill="currentColor"/>

                <!-- Windows -->
                <path
                    d="M11 17
                       H29
                       L34 24
                       H11
                       Z"
                    fill="#ffffff"/>

                <!-- window divider -->
                <path
                    d="M22 17
                       V24"
                    stroke="currentColor"
                    stroke-width="2"/>

                <!-- wheels -->
                <circle
                    cx="14"
                    cy="34"
                    r="3.5"
                    fill="#ffffff"/>

                <circle
                    cx="35"
                    cy="34"
                    r="3.5"
                    fill="#ffffff"/>

            </svg>
        `;
    }


    // =====================================================
    // DEFAULT
    // =====================================================

    return `
        <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">

            <path
                d="M8 29
                   L12 21
                   C13 18.5 15 17 18 17
                   H30
                   C33 17 35 18.5 36 21
                   L40 29
                   V34
                   C40 35.7 38.7 37 37 37
                   H11
                   C9.3 37 8 35.7 8 34
                   Z"
                fill="currentColor"/>

            <path
                d="M16 23
                   L19 19
                   H29
                   L32 23
                   Z"
                fill="#ffffff"/>

            <circle
                cx="14"
                cy="33"
                r="3"
                fill="#ffffff"/>

            <circle
                cx="34"
                cy="33"
                r="3"
                fill="#ffffff"/>

        </svg>
    `;
}

document.addEventListener("DOMContentLoaded", function () {

    const dropdown =
        document.getElementById("vehicleDropdown");

    const trigger =
        document.getElementById("vehicleDropdownTrigger");

    const menu =
        document.getElementById("vehicleDropdownMenu");

    const nativeSelect =
        document.getElementById("vehicle");

    const selectedTitle =
        document.getElementById("vehicleSelectedTitle");

    const selectedSubtitle =
        document.getElementById("vehicleSelectedSubtitle");

    const selectedIcon =
        document.getElementById(
            "vehicleSelectedIcon"
        );

    if (
        !dropdown ||
        !trigger ||
        !menu ||
        !nativeSelect
    ) {
        return;
    }


    // =====================================================
    // OPEN / CLOSE
    // =====================================================

    trigger.addEventListener("click", function () {

        if (trigger.disabled) {
            return;
        }

        dropdown.classList.toggle("open");

    });


    // =====================================================
    // CLOSE WHEN CLICKING OUTSIDE
    // =====================================================

    document.addEventListener("click", function (event) {

        if (!dropdown.contains(event.target)) {

            dropdown.classList.remove("open");

        }

    });


    // =====================================================
    // WATCH NATIVE SELECT
    //
    // ride-form.js loads vehicles asynchronously.
    // MutationObserver detects when options are added.
    // =====================================================

    const observer =
        new MutationObserver(function () {

            renderOptions();

        });


    observer.observe(
        nativeSelect,
        {
            childList: true
        }
    );


    // Initial render
    renderOptions();


    // =====================================================
    // NATIVE SELECT CHANGE
    // =====================================================

    nativeSelect.addEventListener(
        "change",
        function () {

            updateSelectedVehicle();

        }
    );


    // =====================================================
    // RENDER OPTIONS
    // =====================================================

    function renderOptions() {

        const options =
            Array.from(
                nativeSelect.options
            );


        menu.innerHTML = "";


        const validOptions =
            options.filter(
                option =>
                    option.value &&
                    option.value.trim() !== ""
            );


        // No vehicles

        if (validOptions.length === 0) {

            const text =
                options.length > 0
                    ? options[0].textContent.trim()
                    : "No vehicles available";

            menu.innerHTML = `
                <div class="vehicle-dropdown-empty">
                    ${text}
                </div>
            `;

            updateSelectedVehicle();

            return;
        }


        // Create options

        validOptions.forEach(
            function (option) {

                const vehicleOption =
                    document.createElement("button");

                vehicleOption.type =
                    "button";

                vehicleOption.className =
                    "vehicle-dropdown-option";


                // Parse:

                // TS09AB1234 • Honda City • 5 seats

                const parts =
                    option.textContent
                        .split("•")
                        .map(
                            part =>
                                part.trim()
                        );


                const vehicleNumber =
                    parts[0] || "Vehicle";

                const model =
                    parts[1] || "Vehicle";

                const seats =
                    parts[2] || "";

                /*const vehicleIcon =
                    getVehicleIcon(
                        option.dataset.vehicleType
                    );


                vehicleOption.innerHTML = `

                    <div class="vehicle-option-left">

                        <div class="vehicle-option-icon">
                            ${vehicleIcon}
                        </div>

                        <div class="vehicle-option-details">

                            <span class="vehicle-option-model">
                                ${escapeHtml(model)}
                            </span>

                            <span class="vehicle-option-number">
                                ${escapeHtml(vehicleNumber)}
                            </span>

                        </div>

                    </div>

                    <span class="vehicle-option-seats">
                        ${escapeHtml(seats)}
                    </span>

                    <span class="vehicle-option-check">
                        ✓
                    </span>

                `;*/

                const vehicleIcon =
                    getVehicleIcon(
                        option.dataset.vehicleType
                    );


                vehicleOption.innerHTML = `

                    <div class="vehicle-option-left">

                        <div
                            class="vehicle-option-icon"
                            data-vehicle-type="${escapeHtml(
                                option.dataset.vehicleType || "Vehicle"
                            )}">

                            ${vehicleIcon}

                        </div>


                        <div class="vehicle-option-details">

                            <span class="vehicle-option-model">
                                ${escapeHtml(model)}
                            </span>

                            <span class="vehicle-option-number">
                                ${escapeHtml(vehicleNumber)}
                            </span>

                        </div>

                    </div>


                    <span class="vehicle-option-seats">
                        ${escapeHtml(seats)}
                    </span>


                    <span class="vehicle-option-check">
                        ✓
                    </span>

                `;


                vehicleOption.addEventListener(
                    "click",
                    function () {

                        selectVehicle(
                            option.value
                        );

                    }
                );


                menu.appendChild(
                    vehicleOption
                );

            }
        );


        updateSelectedVehicle();

    }


    // =====================================================
    // SELECT VEHICLE
    // =====================================================

    function selectVehicle(vehicleId) {

        nativeSelect.value =
            vehicleId;


        // Trigger the existing
        // ride-form.js change event

        nativeSelect.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles: true
                }
            )
        );


        dropdown.classList.remove(
            "open"
        );


        updateSelectedVehicle();

    }


    // =====================================================
    // UPDATE SELECTED VEHICLE
    // =====================================================

    function updateSelectedVehicle() {

        const selectedOption =
            nativeSelect.options[
                nativeSelect.selectedIndex
            ];

        if (
            !selectedOption ||
            !selectedOption.value
        ) {

            selectedIcon.innerHTML =
                getVehicleIcon("car");

            selectedTitle.textContent =
                "Select your vehicle";

            selectedSubtitle.textContent =
                "Choose one of your registered vehicles";

        } else {

            const parts =
                selectedOption.textContent
                    .split("•")
                    .map(
                        part =>
                            part.trim()
                    );


            const vehicleNumber =
                parts[0] || "Vehicle";

            const model =
                parts[1] || "Vehicle";

            const seats =
                parts[2] || "";


            selectedIcon.innerHTML =
                getVehicleIcon(
                    selectedOption.dataset.vehicleType
                );


            selectedTitle.textContent =
                model;

            selectedSubtitle.textContent =
                vehicleNumber
                + "  •  "
                + seats;
        }


        // Update selected option styling

        const options =
            menu.querySelectorAll(
                ".vehicle-dropdown-option"
            );


        options.forEach(
            function (optionElement, index) {

                const nativeOption =
                    Array.from(
                        nativeSelect.options
                    ).filter(
                        option =>
                            option.value
                    )[index];


                if (
                    nativeOption &&
                    nativeOption.value
                    === nativeSelect.value
                ) {

                    optionElement.classList.add(
                        "selected"
                    );

                } else {

                    optionElement.classList.remove(
                        "selected"
                    );

                }

            }
        );

    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }
});