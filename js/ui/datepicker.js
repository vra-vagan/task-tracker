import { CONSTANTS } from "../config/constants.js";

export const Datepicker = {
    attach(container) {
        const deadLineInputGroup = container.querySelector(".task__form-group-deadline");
        if (!deadLineInputGroup) return;

        const deadLineInput = deadLineInputGroup.querySelector(".task__form-datepicker");
        if (deadLineInput) {
            deadLineInput.addEventListener("click", () => this.render(deadLineInputGroup, deadLineInput));
        }
    },

    render(container, input) {
        const stringDate = input.dataset?.deadline;
        const today = new Date();
        let [initYear, initMonth, initDay] = stringDate ? stringDate.split("-").map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];

        let currentDate = new Date(initYear, initMonth - 1, initDay);
        let isOpened = false;

        const renderCalendar = (year, month) => {
            const selectedDate = new Date(currentDate);
            const dayLast = new Date(year, month + 1, 0).getDate();
            const dayFirst = new Date(year, month, 1).getDay();
            const startIndex = (dayFirst + 6) % 7;

            const emptyStart = Array.from({ length: startIndex }, () => ({ day: "", type: "empty" }));
            const currentMonthDays = Array.from({ length: dayLast }, (_, i) => ({ day: i + 1, type: "current" }));
            let days = [...emptyStart, ...currentMonthDays];

            const totalCells = Math.ceil(days.length / 7) * 7;
            const emptyEnd = Array.from({ length: totalCells - days.length }, () => ({ day: "", type: "empty" }));
            days = [...days, ...emptyEnd];

            const weeks = [];
            for (let i = 0; i < days.length; i += 7) {
                weeks.push(days.slice(i, i + 7));
            }

            const datepicker = document.createElement("div");
            datepicker.className = "datepicker";
            datepicker.dataset.active = isOpened ? "true" : "false";

            const table = document.createElement("table");
            table.className = "datepicker__table";

            const thead = document.createElement("thead");
            thead.innerHTML = `
        <tr class="datepicker__header">
          <th class="datepicker__title" colspan="5">${CONSTANTS.MONTH_NAMES[month]} ${year}</th>
          <th>
            <button class="datepicker__nav datepicker__prev" type="button">
              <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.22807 6.60201C-0.0760234 6.28094 -0.0760234 5.71906 0.22807 5.39799L4.7193 0.26087C5 -0.0869566 5.49123 -0.0869565 5.77193 0.26087C6.07602 0.58194 6.07602 1.14381 5.77193 1.46488L1.81871 6.01338L5.77193 10.5351C6.07602 10.8562 6.07602 11.4181 5.77193 11.7391C5.49123 12.087 5 12.087 4.7193 11.7391L0.22807 6.60201Z" fill="white"/>
              </svg>
            </button>
          </th>
          <th>
            <button class="datepicker__nav datepicker__next" type="button">
              <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.77193 5.39799C6.07602 5.71906 6.07602 6.28094 5.77193 6.60201L1.2807 11.7391C1 12.087 0.508772 12.087 0.22807 11.7391C-0.0760234 11.4181 -0.0760234 10.8562 0.22807 10.5351L4.18129 5.98662L0.22807 1.46488C-0.0760234 1.14381 -0.0760234 0.58194 0.22807 0.26087C0.508772 -0.0869565 1 -0.0869565 1.2807 0.26087L5.77193 5.39799Z" fill="white"/>
              </svg>
            </button>
          </th>
        </tr>
        <tr class="datepicker__weekdays">
          ${CONSTANTS.WEEKDAY_SHORT.map((day) => `<th>${day}</th>`).join("")}
        </tr>
      `;

            const tbody = document.createElement("tbody");
            weeks.forEach((week) => {
                const tr = document.createElement("tr");
                week.forEach((obj) => {
                    const td = document.createElement("td");
                    td.className = "datepicker__day";
                    td.textContent = obj.day;

                    if (obj.type === "empty") {
                        td.classList.add("disabled");
                        tr.appendChild(td);
                        return;
                    }

                    const dateObj = new Date(year, month, obj.day);
                    const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    if (isPast) td.classList.add("disabled");

                    if (dateObj.getFullYear() === selectedDate.getFullYear() && dateObj.getMonth() === selectedDate.getMonth() && dateObj.getDate() === selectedDate.getDate()) {
                        td.classList.add("selected");
                    }

                    if (!td.classList.contains("disabled")) {
                        td.addEventListener("click", () => {
                            const val = `${String(obj.day).padStart(2, "0")}.${String(dateObj.getMonth() + 1).padStart(2, "0")}.${dateObj.getFullYear()}`;
                            const dataVal = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(obj.day).padStart(2, "0")}`;
                            input.value = val;
                            input.dataset.deadline = dataVal;
                            input.dispatchEvent(new Event("input"));
                            closePicker(datepicker);
                        });
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            table.append(thead, tbody);
            datepicker.appendChild(table);

            container.querySelector(".datepicker")?.remove();
            container.appendChild(datepicker);

            if (!isOpened) {
                setTimeout(() => (datepicker.dataset.active = "true"), 0);
                isOpened = true;
            }

            thead.querySelector(".datepicker__prev").addEventListener("click", (e) => {
                e.stopPropagation();
                const newMonth = new Date(year, month - 1);
                renderCalendar(newMonth.getFullYear(), newMonth.getMonth());
            });

            thead.querySelector(".datepicker__next").addEventListener("click", (e) => {
                e.stopPropagation();
                const newMonth = new Date(year, month + 1);
                renderCalendar(newMonth.getFullYear(), newMonth.getMonth());
            });

            const handlePickerClick = (e) => {
                if (e.target.closest(".datepicker") || e.target.closest(".task__form-datepicker")) return;
                closePicker(datepicker);
                document.removeEventListener("click", handlePickerClick);
            };

            document.addEventListener("click", handlePickerClick);
        };

        const closePicker = (datepicker) => {
            datepicker.dataset.active = "false";
            setTimeout(() => {
                datepicker.remove();
                isOpened = false;
            }, 300);
        };

        const existingPicker = container.querySelector(".datepicker");
        if (existingPicker) {
            closePicker(existingPicker);
        } else {
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        }
    },
};
