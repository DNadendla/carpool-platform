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


    async request(url, options = {}) {

        const token =
            localStorage.getItem(
                "accessToken"
            );


        const headers = {

            "Content-Type":
                "application/json",

            ...options.headers
        };


        if (token) {

            headers["Authorization"] =
                "Bearer " + token;
        }


        let response =
            await fetch(url, {
                ...options,
                headers
            });


        // =====================================================
        // ACCESS TOKEN EXPIRED
        // =====================================================

        if (response.status === 401) {

            const refreshed =
                await this.refreshAccessToken();


            if (refreshed) {

                const newToken =
                    localStorage.getItem(
                        "accessToken"
                    );


                headers["Authorization"] =
                    "Bearer " + newToken;


                // Retry request once

                response =
                    await fetch(url, {
                        ...options,
                        headers
                    });


                return response;
            }


            // Refresh failed

            this.clearAuthentication();

            window.location.href =
                "/login";

            return null;
        }


        return response;
    },


    // =========================================================
    // REFRESH TOKEN
    // =========================================================

    async refreshAccessToken() {

        const refreshToken =
            localStorage.getItem(
                "refreshToken"
            );


        if (!refreshToken) {

            return false;
        }


        try {
            const response =
                await fetch(
                    "/api/auth/refresh",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            refreshToken:
                                refreshToken
                        })
                    }
                );


            if (!response.ok) {
                return false;
            }

            const data =
                await response.json();

            localStorage.setItem(
                "accessToken",
                data.accessToken
            );


            localStorage.setItem(
                "tokenType",
                data.tokenType
            );


            localStorage.setItem(
                "expiresIn",
                data.expiresIn
            );

            localStorage.setItem(
                "tokenExpiresAt",
                Date.now() +
                    Number(data.expiresIn)
            );

            return true;
        } catch (error) {
            console.error(
                "Token refresh failed:",
                error
            );
            return false;
        }
    },


    // =========================================================
    // CLEAR AUTHENTICATION
    // =========================================================

    clearAuthentication() {

        localStorage.removeItem(
            "accessToken"
        );

        localStorage.removeItem(
            "refreshToken"
        );

        localStorage.removeItem(
            "tokenType"
        );

        localStorage.removeItem(
            "userEmail"
        );

        localStorage.removeItem(
            "expiresIn"
        );

        localStorage.removeItem(
            "tokenExpiresAt"
        );
    }
};