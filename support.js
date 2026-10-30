const supportForm = document.getElementById("support-form");
const supportMessage = document.getElementById("support-message");
const supportSubmit = document.getElementById("support-submit");
const queryList = document.getElementById("query-list");
const refreshQueriesButton = document.getElementById("refresh-queries");

async function parseSupportResponse(response) {
    const responseText = await response.text();
    if (!responseText.trim()) {
        throw new Error(`The server returned an empty response (HTTP ${response.status}).`);
    }

    try {
        return JSON.parse(responseText);
    } catch {
        throw new Error(`The server returned an invalid response (HTTP ${response.status}).`);
    }
}

function createQueryCard(query) {
    const card = document.createElement("article");
    card.className = "query-card";

    const heading = document.createElement("div");
    heading.className = "query-card-heading";

    const subject = document.createElement("h3");
    subject.textContent = query.subject;
    heading.appendChild(subject);

    const status = document.createElement("span");
    status.className = query.response ? "query-status query-status-answered" : "query-status";
    status.textContent = query.response ? "Answered" : "Waiting for teacher";
    heading.appendChild(status);
    card.appendChild(heading);

    const teacher = document.createElement("p");
    teacher.className = "query-teacher";
    teacher.textContent = `To: ${query.teacher}`;
    card.appendChild(teacher);

    const queryText = document.createElement("p");
    queryText.className = "query-text";
    queryText.textContent = query.query;
    card.appendChild(queryText);

    if (query.response) {
        const response = document.createElement("div");
        response.className = "teacher-response";
        const responseHeading = document.createElement("strong");
        responseHeading.textContent = "Teacher response";
        const responseText = document.createElement("p");
        responseText.textContent = query.response;
        response.append(responseHeading, responseText);
        card.appendChild(response);
    }

    const createdAt = document.createElement("time");
    createdAt.className = "query-date";
    createdAt.textContent = `Submitted ${new Date(`${query.created_at}Z`).toLocaleString()}`;
    card.appendChild(createdAt);
    return card;
}

async function loadQueries() {
    queryList.replaceChildren();
    const loading = document.createElement("p");
    loading.className = "query-empty";
    loading.textContent = "Loading your queries…";
    queryList.appendChild(loading);

    try {
        const response = await fetch("/support/queries");
        const data = await parseSupportResponse(response);
        if (!response.ok) {
            throw new Error(data.error || "Could not load your support queries.");
        }

        queryList.replaceChildren();
        if (data.queries.length === 0) {
            const emptyState = document.createElement("p");
            emptyState.className = "query-empty";
            emptyState.textContent = "You have not submitted any queries yet.";
            queryList.appendChild(emptyState);
            return;
        }

        data.queries.forEach((query) => queryList.appendChild(createQueryCard(query)));
    } catch (error) {
        queryList.replaceChildren();
        const errorMessage = document.createElement("p");
        errorMessage.className = "query-empty query-load-error";
        errorMessage.textContent = error.message || "Could not load your support queries.";
        queryList.appendChild(errorMessage);
    }
}

supportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    supportMessage.textContent = "";
    supportMessage.className = "support-message";
    supportSubmit.disabled = true;

    try {
        const response = await fetch("/support/queries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                teacher: supportForm.elements.teacher.value,
                subject: supportForm.elements.subject.value.trim(),
                query: supportForm.elements.query.value.trim()
            })
        });
        const data = await parseSupportResponse(response);
        if (!response.ok) {
            throw new Error(data.error || "Could not submit your query.");
        }

        supportForm.reset();
        supportMessage.textContent = "Your query was sent. It is now waiting for a teacher response.";
        supportMessage.classList.add("support-message-success");
        await loadQueries();
    } catch (error) {
        supportMessage.textContent = error.message || "Unable to reach the support service.";
        supportMessage.classList.add("support-message-error");
    } finally {
        supportSubmit.disabled = false;
    }
});

refreshQueriesButton.addEventListener("click", loadQueries);
loadQueries();
