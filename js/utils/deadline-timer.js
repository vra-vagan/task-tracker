import { state } from "../state/state.js";

export const DeadlineTimer = {
    start() {
        clearInterval(state.deadlineTimerInterval);
        this.updateAll();

        const now = new Date();
        const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

        setTimeout(() => {
            this.updateAll();
            state.deadlineTimerInterval = setInterval(() => this.updateAll(), 60000);
        }, msToNextMinute);
    },

    updateAll() {
        document.querySelectorAll(".task__deadline").forEach((el) => {
            const deadline = el.dataset.deadline;
            const timeLeft = this.calculateTimeLeft(deadline);
            const span = el.querySelector("span");
            if (span) span.textContent = timeLeft;
        });
    },

    calculateTimeLeft(deadlineStr) {
        const now = new Date();
        const [year, month, day] = deadlineStr.split("-").map(Number);
        const deadlineLocal = new Date(year, month - 1, day);
        const diffMs = deadlineLocal - now;

        if (diffMs <= 0) return "0 м";

        const diffMins = Math.floor(diffMs / 1000 / 60);
        const hours = Math.floor(diffMins / 60);
        const minutes = diffMins % 60;

        return `${hours} ч ${minutes} м`;
    },
};
