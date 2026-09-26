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


                vehicleOption.innerHTML = `

                    <div class="vehicle-option-left">

                        <div class="vehicle-option-icon">
                            🚗
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