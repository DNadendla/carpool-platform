(function () {

    const savedTheme =
        localStorage.getItem("carpoolTheme");

    const initialTheme =
        savedTheme === "dark"
            ? "dark"
            : "light";

    document.documentElement
        .setAttribute("data-theme", initialTheme);

})();


document.addEventListener("DOMContentLoaded", function () {

    const themeToggle =
        document.getElementById("themeToggle");

    const themeIcon =
        document.getElementById("themeIcon");

    if (!themeToggle || !themeIcon) {
        return;
    }

    function applyTheme(theme) {

        document.documentElement
            .setAttribute("data-theme", theme);

        if (theme === "dark") {

            themeIcon.textContent = "🌙";

            themeToggle.setAttribute(
                "aria-label",
                "Switch to light theme"
            );

            themeToggle.setAttribute(
                "title",
                "Switch to light theme"
            );

        } else {

            themeIcon.textContent = "☀️";

            themeToggle.setAttribute(
                "aria-label",
                "Switch to dark theme"
            );

            themeToggle.setAttribute(
                "title",
                "Switch to dark theme"
            );
        }
    }


    const currentTheme =
        document.documentElement
            .getAttribute("data-theme");

    applyTheme(currentTheme || "light");


    themeToggle.addEventListener(
        "click",
        function () {

            const currentTheme =
                document.documentElement
                    .getAttribute("data-theme");

            const nextTheme =
                currentTheme === "dark"
                    ? "light"
                    : "dark";

            localStorage.setItem(
                "carpoolTheme",
                nextTheme
            );

            applyTheme(nextTheme);
        }
    );

});