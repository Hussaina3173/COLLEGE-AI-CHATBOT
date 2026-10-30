const year = 2026;
const holidays = {
    "2026-01-26": "Republic Day",
    "2026-08-15": "Independence Day",
    "2026-10-02": "Gandhi Jayanti",
    "2026-12-25": "Christmas Day"
};

const monthHeading = document.getElementById("calendar-month");
const calendarGrid = document.getElementById("calendar-grid");
const previousMonthButton = document.getElementById("previous-month");
const nextMonthButton = document.getElementById("next-month");
let displayedMonth = 0;

function renderCalendar() {
    const firstWeekday = new Date(year, displayedMonth, 1).getDay();
    const daysInMonth = new Date(year, displayedMonth + 1, 0).getDate();
    const monthName = new Intl.DateTimeFormat("en", { month: "long" }).format(
        new Date(year, displayedMonth, 1)
    );
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    monthHeading.textContent = `${monthName} ${year}`;
    calendarGrid.replaceChildren();

    weekdays.forEach((weekday) => {
        const heading = document.createElement("div");
        heading.className = "calendar-weekday";
        heading.setAttribute("role", "columnheader");
        heading.textContent = weekday;
        calendarGrid.appendChild(heading);
    });

    for (let blank = 0; blank < firstWeekday; blank += 1) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day calendar-day-empty";
        emptyCell.setAttribute("role", "gridcell");
        emptyCell.setAttribute("aria-hidden", "true");
        calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const dateKey = `${year}-${String(displayedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const holidayName = holidays[dateKey];
        const cell = document.createElement("div");
        cell.className = holidayName ? "calendar-day holiday-day" : "calendar-day";
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", holidayName ? `${monthName} ${day}: ${holidayName}` : `${monthName} ${day}`);
        if (holidayName) {
            cell.title = holidayName;
        }

        const dateNumber = document.createElement("span");
        dateNumber.className = "calendar-date-number";
        dateNumber.textContent = String(day);
        cell.appendChild(dateNumber);

        if (holidayName) {
            const holidayLabel = document.createElement("span");
            holidayLabel.className = "calendar-holiday-label";
            holidayLabel.textContent = holidayName;
            cell.appendChild(holidayLabel);
        }

        calendarGrid.appendChild(cell);
    }

    previousMonthButton.disabled = displayedMonth === 0;
    nextMonthButton.disabled = displayedMonth === 11;
}

previousMonthButton.addEventListener("click", () => {
    if (displayedMonth > 0) {
        displayedMonth -= 1;
        renderCalendar();
    }
});

nextMonthButton.addEventListener("click", () => {
    if (displayedMonth < 11) {
        displayedMonth += 1;
        renderCalendar();
    }
});

renderCalendar();
