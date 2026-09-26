(function () {

    function isAuthenticated() {
        const token =
            localStorage.getItem("accessToken");

        return token !== null && token.trim() !== "";
    }

    // Handle normal page load
    if (!isAuthenticated()) {
        window.location.replace("/login");
        return;
    }

    // Handle browser Back / Forward / BFCache
    window.addEventListener("pageshow", function (event) {

        if (!isAuthenticated()) {
            window.location.replace("/login");
        }

    });

})();