        const messages = document.getElementById("messages");
        const input = document.getElementById("user-input");
        const sendBtn = document.getElementById("send-btn");
        const chips = document.querySelectorAll(".chip");
        const profileButton = document.getElementById("profile-button");
        const profileName = document.getElementById("profile-name");
        const profileAvatar = profileButton.querySelector(".avatar");
        const loginDialog = document.getElementById("login-dialog");
        const loginForm = document.getElementById("login-form");
        const loginError = document.getElementById("login-error");
        const loginSubmit = document.getElementById("login-submit");
        const logoutButton = document.getElementById("logout-button");
        const toggleAuthMode = document.getElementById("toggle-auth-mode");
        const loginTitle = document.getElementById("login-title");
        const loginDescription = document.getElementById("login-description");
        let authMode = "login";
        let currentUser = null;
        let chatPending = false;
        const chatHistory = [];

        async function readJsonResponse(response) {
            const body = await response.text();
            if (!body.trim()) {
                if (response.status === 405) {
                    throw new Error(
                        "Registration was sent to a server that does not handle Flask POST requests. Start app.py and open the dashboard at http://127.0.0.1:5000/ instead of using Live Server or opening the HTML file directly."
                    );
                }
                throw new Error(
                    `The server returned an empty response (HTTP ${response.status}). Check the Flask server output.`
                );
            }

            try {
                return JSON.parse(body);
            } catch {
                throw new Error(
                    `The server returned an invalid response (HTTP ${response.status}). Check the Flask server output.`
                );
            }
        }

        function updateProfile(user) {
            currentUser = user && user.username ? user : null;
            const loggedIn = Boolean(currentUser);
            const displayName = currentUser
                ? (currentUser.full_name || currentUser.username)
                : "Student";
            profileName.textContent = displayName;
            profileAvatar.textContent = displayName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
            loginSubmit.hidden = loggedIn;
            logoutButton.hidden = !loggedIn;
            toggleAuthMode.hidden = loggedIn;
            loginForm.querySelectorAll(".login-field, .registration-field").forEach((element) => {
                element.hidden = loggedIn;
            });
            loginError.textContent = loggedIn
                ? `Signed in as ${currentUser.full_name || currentUser.username}.`
                : "";
            updateAuthMode();
        }

        profileButton.addEventListener("click", () => {
            authMode = "login";
            updateAuthMode();
            loginError.textContent = "";
            loginDialog.showModal();
        });

        function updateAuthMode() {
            const registering = authMode === "register";
            loginTitle.textContent = registering ? "Create student account" : "Student login";
            loginDescription.textContent = registering
                ? "Register for your Smart Campus account."
                : "Sign in to your Smart Campus account.";
            loginSubmit.textContent = registering ? "Register" : "Log in";
            toggleAuthMode.textContent = registering ? "I already have an account" : "Create an account";
            loginForm.querySelectorAll(".registration-field").forEach((field) => {
                field.hidden = !registering || Boolean(currentUser);
            });
            loginForm.elements.full_name.required = registering;
            loginForm.elements.email.required = registering;
            document.getElementById("login-password").setAttribute(
                "autocomplete",
                registering ? "new-password" : "current-password"
            );
        }

        toggleAuthMode.addEventListener("click", () => {
            authMode = authMode === "login" ? "register" : "login";
            loginError.textContent = "";
            loginForm.elements.password.value = "";
            updateAuthMode();
        });

        document.getElementById("close-login").addEventListener("click", () => {
            loginDialog.close();
        });

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            loginError.textContent = "";
            loginSubmit.disabled = true;

            try {
                const response = await fetch(authMode === "register" ? "/register" : "/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: loginForm.elements.username.value.trim(),
                        password: loginForm.elements.password.value,
                        full_name: loginForm.elements.full_name.value.trim(),
                        email: loginForm.elements.email.value.trim(),
                        phone: loginForm.elements.phone.value.trim(),
                        program: loginForm.elements.program.value.trim(),
                        year: loginForm.elements.year.value
                    })
                });
                const data = await readJsonResponse(response);
                if (!response.ok) {
                    throw new Error(data.error || "Authentication failed. Please try again.");
                }

                loginForm.elements.password.value = "";
                updateProfile(data);
                authMode = "login";
                updateAuthMode();
            } catch (error) {
                loginError.textContent = error.message || "Unable to reach the login service.";
            } finally {
                loginSubmit.disabled = false;
            }
        });

        logoutButton.addEventListener("click", async () => {
            logoutButton.disabled = true;
            try {
                const response = await fetch("/logout", { method: "POST" });
                if (!response.ok) {
                    throw new Error("Could not log out. Please try again.");
                }
                updateProfile(null);
                loginForm.reset();
            } catch (error) {
                loginError.textContent = error.message || "Unable to reach the login service.";
            } finally {
                logoutButton.disabled = false;
            }
        });

        fetch("/session")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Could not check the login session.");
                }
                return readJsonResponse(response);
            })
            .then((data) => updateProfile(data.username))
            .catch((error) => {
                loginError.textContent = error.message;
            });

        function addMessage(text, sender) {
            const msg = document.createElement("div");
            msg.classList.add("message", sender);
            msg.textContent = text;
            messages.appendChild(msg);
            messages.scrollTop = messages.scrollHeight;
        }

        function showTyping() {
            const typing = document.createElement("div");
            typing.classList.add("typing");
            typing.id = "typing-indicator";
            typing.innerHTML = "<span></span><span></span><span></span>";
            messages.appendChild(typing);
            messages.scrollTop = messages.scrollHeight;
        }

        function hideTyping() {
            const typing = document.getElementById("typing-indicator");
            if (typing) typing.remove();
        }

        async function sendMessage() {
            const text = input.value.trim();
            if (!text || chatPending) return;

            chatPending = true;
            addMessage(text, "user");
            input.value = "";
            showTyping();
            sendBtn.disabled = true;

            try {
                const response = await fetch("/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text, history: chatHistory.slice(-10) })
                });
                const data = await readJsonResponse(response);
                if (!response.ok) {
                    throw new Error(data.error || "The AI assistant could not answer. Please try again.");
                }
                hideTyping();
                addMessage(data.response, "bot");
                chatHistory.push(
                    { role: "user", text },
                    { role: "model", text: data.response }
                );
            } catch (error) {
                hideTyping();
                addMessage(error.message || "I’m having trouble reaching the server right now. Please try again.", "bot");
            } finally {
                chatPending = false;
                sendBtn.disabled = false;
            }
        }

        sendBtn.addEventListener("click", sendMessage);

        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendMessage();
            }
        });

        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                input.value = chip.textContent;
                sendMessage();
            });
        });
