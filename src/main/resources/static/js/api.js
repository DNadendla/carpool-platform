const API = {

    async get(url) {
        return this.request(url, {
            method: "GET"
        });
    },

    async post(url, body) {
        return this.request(url, {
            method: "POST",
            body: JSON.stringify(body)
        });
    },

    async put(url, body) {
        return this.request(url, {
            method: "PUT",
            body: JSON.stringify(body)
        });
    },

    async patch(url, body) {
        return this.request(url, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    },

    async delete(url) {
        return this.request(url, {
            method: "DELETE"
        });
    },

    /*async request(url, options = {}) {

        const token = localStorage.getItem("accessToken");

        const headers = {
            "Content-Type": "application/json",
            ...options.headers
        };

        // Add JWT to every protected API request
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        // JWT missing / expired / invalid
        if (response.status === 401) {

            localStorage.removeItem("accessToken");
            localStorage.removeItem("tokenType");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("expiresIn");

            window.location.href = "/login";

            return null;
        }

        return response;
    }*/

    async request(url, options = {}) {

        const token = localStorage.getItem("accessToken");

        const headers = {
            "Content-Type": "application/json",
            ...options.headers
        };

        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {

            localStorage.removeItem("accessToken");
            localStorage.removeItem("tokenType");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("expiresIn");

            window.location.href = "/unauthorized";

            return null;
        }

        return response;
    }
};