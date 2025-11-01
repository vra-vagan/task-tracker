import { setDeadlineTimerInterval, getDeadlineTimerInterval } from "./store.js";
import { SELECTORS, MESSAGES, CONFIG } from "./constants.js";

const escapeHTML = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

// Валидация формы
const validateFormFields = (fields) => {
    let hasError = false;
    fields.forEach((input) => {
        if (!input) return;
        const value = input.value.trim();
        if (!value) {
            input.classList.add("error");
            hasError = true;
        } else {
            input.classList.remove("error");
        }
    });
    return !hasError;
};

// Состояние кнопки загрузки
const setButtonLoading = (button, isLoading) => {
    if (!button) return;
    if (isLoading) {
        button.classList.add("loading");
        button.disabled = true;
    } else {
        button.classList.remove("loading");
        button.disabled = false;
    }
};

const convertLinksToAnchors = (text) => {
    const safeText = escapeHTML(text);

    if (/[<>]/.test(text)) {
        return safeText;
    }

    return safeText.replace(/((https?:\/\/|www\.)[^\s<>()\]]+[^\s<>,.?!:;()\]])/gi, (match) => {
        let url = match;
        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }
        return `<span class="task__full-description-link">
                    <a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>
                    <button class="btn__copy" data-url="${url}">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.5 2H13.375C13.75 2 14.1562 2.1875 14.4375 2.46875L16.5312 4.5625C16.8125 4.84375 17 5.25 17 5.625V12.5C17 13.3438 16.3125 14 15.5 14H9.5C8.65625 14 8 13.3438 8 12.5V3.5C8 2.6875 8.65625 2 9.5 2ZM4.5 6H7V8H5V16H11V15H13V16.5C13 17.3438 12.3125 18 11.5 18H4.5C3.65625 18 3 17.3438 3 16.5V7.5C3 6.6875 3.65625 6 4.5 6Z" fill="#0078FF"></path>
                        </svg>
                    </button>
                </span>`;
    });
};

const copyToClipboard = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);

    let clipboardContainer = document.querySelector(SELECTORS.clipboard);
    if (!clipboardContainer) {
        clipboardContainer = document.createElement("div");
        clipboardContainer.className = "clipboard";
        document.body.appendChild(clipboardContainer);
    }

    const clipboardItem = document.createElement("div");
    clipboardItem.className = "clipboard__item";
    clipboardItem.textContent = MESSAGES.linkCopied;
    clipboardContainer.appendChild(clipboardItem);

    setTimeout(() => {
        clipboardItem.style.opacity = "0";
        setTimeout(() => {
            clipboardItem.remove();
            const container = document.querySelector(SELECTORS.clipboard);
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, CONFIG.TRANSITION_DELAY);
    }, CONFIG.CLIPBOARD_DURATION);
};

const getTimeLeftToLocalMidnight = (deadlineStr) => {
    const now = new Date();

    const [year, month, day] = deadlineStr.split("-").map(Number);
    const deadlineLocal = new Date(year, month - 1, day);

    const diffMs = deadlineLocal - now;

    if (diffMs <= 0) return "0 м";

    const diffMins = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    return `${hours} ч ${minutes} м`;
};

const updateAllDeadlines = () => {
    document.querySelectorAll(SELECTORS.taskDeadline).forEach((el) => {
        const deadline = el.dataset.deadline;
        const timeLeft = getTimeLeftToLocalMidnight(deadline);
        const span = el.querySelector("span");
        if (span) span.textContent = timeLeft;
    });
};

const startDeadlineTimers = () => {
    clearInterval(getDeadlineTimerInterval());
    updateAllDeadlines();

    const now = new Date();
    const msToNextMinute = CONFIG.DEADLINE_CHECK_INTERVAL - (now.getSeconds() * 1000 + now.getMilliseconds());

    setTimeout(() => {
        updateAllDeadlines();
        setDeadlineTimerInterval(setInterval(updateAllDeadlines, CONFIG.DEADLINE_CHECK_INTERVAL));
    }, msToNextMinute);
};

export { escapeHTML, convertLinksToAnchors, copyToClipboard, startDeadlineTimers, updateAllDeadlines, getTimeLeftToLocalMidnight, validateFormFields, setButtonLoading };
