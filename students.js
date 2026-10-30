const profileFields = {
    name: document.getElementById("student-full-name"),
    program: document.getElementById("student-program"),
    email: document.getElementById("student-email"),
    phone: document.getElementById("student-phone"),
    username: document.getElementById("student-username"),
    year: document.getElementById("student-year")
};
const profilePhoto = document.querySelector(".student-photo");

fetch("/session")
    .then(async (response) => {
        const body = await response.text();
        if (!response.ok) {
            throw new Error(`Could not load student profile (HTTP ${response.status}).`);
        }
        if (!body.trim()) {
            throw new Error("The server returned an empty student profile.");
        }
        return JSON.parse(body);
    })
    .then((profile) => {
        if (!profile.username) {
            return;
        }

        const fullName = profile.full_name || profile.username;
        profileFields.name.textContent = fullName;
        profileFields.program.textContent = profile.program || "Program not provided";
        profileFields.email.textContent = profile.email || "Not provided";
        profileFields.phone.textContent = profile.phone || "Not provided";
        profileFields.username.textContent = profile.username;
        profileFields.year.textContent = profile.year
            ? (profile.year === "PG" ? "Postgraduate" : `Year ${profile.year}`)
            : "Not provided";
        profilePhoto.textContent = fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
        profilePhoto.setAttribute("aria-label", `Profile initials for ${fullName}`);
    })
    .catch((error) => {
        profileFields.name.textContent = error.message || "Could not load profile";
    });
