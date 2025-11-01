import { db, tasksRef } from "./firebase.js";
import { addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, startAfter, where, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { taskContainer } from "./main.js";
import { getCurrentUser, setLastVisible, setHasMore, setIsLoading, getIsLoading, getHasMore, setAllTasks, getAllTasks, getLastVisible } from "./store.js";
import { escapeHTML, startDeadlineTimers } from "./utils.js";
import { STATUS_MAP, MESSAGES, CONFIG, SELECTORS } from "./constants.js";

const BOT_TOKEN = "7399906374:AAEZt86SEiN8vqwqpeXwf-foSmrpNNuQu60";
const CHAT_ID = "262304440";

const LIMIT = CONFIG.LIMIT_TASKS;

const sendToTelegram = (task) => {
    const text = `
<b>${task.title}</b>

${task.description}

<b>От:</b> ${task.createdBy}
${task.tzLink ? `<b>ТЗ:</b> <a href="${task.tzLink}">Смотреть ТЗ</a>` : ""}
${task.figmaLink ? `<b>Figma:</b> <a href="${task.figmaLink}">Смотреть макет</a>` : ""}
${task.deadLine ? `<b>Дедлайн:</b> ${task.deadLine}` : ""}
<b>Создано: </b>${new Date(task.createdAt).toLocaleString("ru-RU")}
    `;

    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text,
            parse_mode: "HTML",
        }),
    });
};

const loadTasks = async (isNextPage = false) => {
    if (getIsLoading() || (isNextPage && !getHasMore())) return;
    setIsLoading(true);

    if (!taskContainer) return;
    taskContainer.classList.add("loading");

    let q;
    const currentUser = getCurrentUser();
    const baseQuery = [orderBy("createdAt", "desc"), limit(LIMIT)];
    
    if (currentUser?.role === "admin") {
        q = isNextPage 
            ? query(tasksRef, ...baseQuery, startAfter(getLastVisible()))
            : query(tasksRef, ...baseQuery);
    } else {
        const companyFilter = currentUser?.login || "";
        const companyQuery = [where("company", "==", companyFilter), ...baseQuery];
        q = isNextPage
            ? query(tasksRef, ...companyQuery, startAfter(getLastVisible()))
            : query(tasksRef, ...companyQuery);
    }

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

        if (!isNextPage) {
            setAllTasks(tasks);
        } else {
            setAllTasks([...getAllTasks(), ...tasks]);
        }

        renderTasks(getAllTasks());
    } else {
        setHasMore(false);
    }

    taskContainer.classList.remove("loading");
    setIsLoading(false);
};

const renderTasks = (tasks) => {
    taskContainer.innerHTML = "";
    const today = new Date().toISOString().split("T")[0];

    const titleEl = document.querySelector(SELECTORS.contentHeaderTitle);
    titleEl.textContent = MESSAGES.allTasks;

    if (tasks.length > 0) {
        tasks.forEach((task) => {
            const taskDate = task.createdAt.split("T")[0];
            const isToday = taskDate === today;
            const dateLabel = isToday ? "Сегодня" : new Date(taskDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

            const taskItem = document.createElement("div");
            taskItem.className = "task";
            taskItem.dataset.status = task.status;
            taskItem.dataset.id = task.id;
            taskItem.innerHTML = `
                <div class="task__info">
                    <div class="task__top">
                        <div class="task__top-title-container">
                            <h2 class="task__top-title">${task.title}</h2>
                        </div>
                        <p class="task__top-description">${escapeHTML(task.description)}</p>
                    </div>
                    <div class="task__bottom">
                        <p class="task__bottom-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
                                <path d="M2.25 0.75C2.25 0.351562 2.57812 0 3 0C3.39844 0 3.75 0.351562 3.75 0.75V1.5H6.75V0.75C6.75 0.351562 7.07812 0 7.5 0C7.89844 0 8.25 0.351562 8.25 0.75V1.5H9.375C9.98438 1.5 10.5 2.01562 10.5 2.625V3.75H0V2.625C0 2.01562 0.492188 1.5 1.125 1.5H2.25V0.75ZM10.5 4.5V10.875C10.5 11.5078 9.98438 12 9.375 12H1.125C0.492188 12 0 11.5078 0 10.875V4.5H10.5Z" fill="white"/>
                            </svg>
                            <span>${dateLabel}</span>
                        </p>
                        <p class="task__bottom-item task__created-by">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
                                <path d="M5.25 6C4.17188 6 3.1875 5.4375 2.64844 4.5C2.10938 3.58594 2.10938 2.4375 2.64844 1.5C3.1875 0.585938 4.17188 0 5.25 0C6.30469 0 7.28906 0.585938 7.82812 1.5C8.36719 2.4375 8.36719 3.58594 7.82812 4.5C7.28906 5.4375 6.30469 6 5.25 6ZM4.17188 7.125H6.30469C8.625 7.125 10.5 9 10.5 11.3203C10.5 11.6953 10.1719 12 9.79688 12H0.679688C0.304688 12 0 11.6953 0 11.3203C0 9 1.85156 7.125 4.17188 7.125Z" fill="white"/>
                            </svg>
                            <span>${task.createdBy}</span>
                        </p>
                        ${
                            task.deadLine && task.status !== "done"
                                ? `
                                <p class="task__bottom-item task__deadline" data-deadline="${task.deadLine}">
                                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 6.25586C0 4.12305 1.125 2.1543 3 1.07617C4.85156 -0.00195312 7.125 -0.00195312 9 1.07617C10.8516 2.1543 12 4.12305 12 6.25586C12 8.41211 10.8516 10.3809 9 11.459C7.125 12.5371 4.85156 12.5371 3 11.459C1.125 10.3809 0 8.41211 0 6.25586ZM5.4375 3.06836C5.4375 4.14648 5.4375 5.20117 5.4375 6.25586C5.4375 6.44336 5.53125 6.63086 5.67188 6.72461C6.42188 7.24023 7.17188 7.73242 7.92188 8.22461C8.01562 8.29492 8.13281 8.31836 8.25 8.31836C8.41406 8.31836 8.60156 8.24805 8.71875 8.08398C8.76562 7.99023 8.8125 7.87305 8.8125 7.75586C8.8125 7.5918 8.71875 7.4043 8.55469 7.28711L6.5625 5.97461C6.5625 5.01367 6.5625 4.0293 6.5625 3.06836C6.5625 3.06836 6.5625 3.04492 6.53906 3.02148C6.53906 2.99805 6.53906 2.97461 6.53906 2.97461C6.53906 2.92773 6.51562 2.88086 6.51562 2.85742C6.46875 2.78711 6.44531 2.74023 6.39844 2.66992C6.28125 2.57617 6.14062 2.50586 6 2.50586C5.67188 2.50586 5.4375 2.76367 5.4375 3.06836Z" fill="white"/>
                                        <path d="M6 2.50586C6.30469 2.50586 6.5625 2.76367 6.5625 3.06836V5.97461L8.55469 7.28711C8.8125 7.47461 8.88281 7.82617 8.71875 8.08398C8.53125 8.3418 8.17969 8.41211 7.92188 8.22461L5.67188 6.72461C5.53125 6.63086 5.4375 6.44336 5.4375 6.25586V3.06836C5.4375 2.76367 5.67188 2.50586 6 2.50586Z" fill="white" fill-opacity="0.4"/>
                                    </svg>
                                    <span></span>
                                </p>`
                                : ""
                        }
                        ${
                            task.tzLink
                                ? `<a href="${task.tzLink}" class="task__bottom-item task__link task__link-t" target="_blank">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="12" viewBox="0 0 15 12" fill="none">
                                        <path d="M13.5645 6.18169L10.9395 8.80669C9.62695 10.1426 7.4707 10.1426 6.1582 8.80669C4.98633 7.63481 4.82227 5.80669 5.7832 4.44731L5.80664 4.42388C6.06445 4.07231 6.5332 4.002 6.86133 4.23638C7.18945 4.47075 7.2832 4.9395 7.02539 5.29106L7.00195 5.3145C6.46289 6.0645 6.55664 7.09575 7.21289 7.752C7.93945 8.502 9.13477 8.502 9.88477 7.752L12.5098 5.127C13.2598 4.377 13.2598 3.18169 12.5098 2.45513C11.8535 1.79888 10.8223 1.70513 10.0723 2.24419L10.0488 2.26763C9.69727 2.52544 9.22852 2.43169 8.99414 2.10356C8.75977 1.77544 8.83008 1.30669 9.1582 1.04888L9.20508 1.02544C10.5645 0.0645015 12.3926 0.228564 13.5645 1.40044C14.9004 2.71294 14.9004 4.86919 13.5645 6.18169ZM1.40039 5.64263L4.02539 2.99419C5.36133 1.68169 7.49414 1.68169 8.83008 2.99419C10.002 4.16606 10.1426 6.01763 9.18164 7.377L9.1582 7.40044C8.92383 7.752 8.43164 7.82231 8.10352 7.58794C7.77539 7.35356 7.68164 6.88481 7.93945 6.53325L7.96289 6.50981C8.50195 5.73638 8.4082 4.72856 7.75195 4.07231C7.02539 3.32231 5.83008 3.32231 5.08008 4.07231L2.45508 6.69731C1.72852 7.42388 1.72852 8.61919 2.45508 9.36919C3.11133 10.0254 4.14258 10.1192 4.89258 9.58013L4.91602 9.55669C5.26758 9.29888 5.73633 9.39263 5.9707 9.72075C6.20508 10.0489 6.13477 10.5176 5.80664 10.7754L5.75977 10.7989C4.42383 11.7598 2.57227 11.5958 1.40039 10.4239C0.0644531 9.11138 0.0644531 6.95513 1.40039 5.64263Z" fill="white"/>
                                    </svg>
                                    <span>ТЗ</span>
                                </a>`
                                : ""
                        }
                        ${
                            task.figmaLink
                                ? `<a href="${task.figmaLink}" class="task__bottom-item task__link task__link-f" target="_blank">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="12" viewBox="0 0 15 12" fill="none">
                                        <path d="M13.5645 6.18169L10.9395 8.80669C9.62695 10.1426 7.4707 10.1426 6.1582 8.80669C4.98633 7.63481 4.82227 5.80669 5.7832 4.44731L5.80664 4.42388C6.06445 4.07231 6.5332 4.002 6.86133 4.23638C7.18945 4.47075 7.2832 4.9395 7.02539 5.29106L7.00195 5.3145C6.46289 6.0645 6.55664 7.09575 7.21289 7.752C7.93945 8.502 9.13477 8.502 9.88477 7.752L12.5098 5.127C13.2598 4.377 13.2598 3.18169 12.5098 2.45513C11.8535 1.79888 10.8223 1.70513 10.0723 2.24419L10.0488 2.26763C9.69727 2.52544 9.22852 2.43169 8.99414 2.10356C8.75977 1.77544 8.83008 1.30669 9.1582 1.04888L9.20508 1.02544C10.5645 0.0645015 12.3926 0.228564 13.5645 1.40044C14.9004 2.71294 14.9004 4.86919 13.5645 6.18169ZM1.40039 5.64263L4.02539 2.99419C5.36133 1.68169 7.49414 1.68169 8.83008 2.99419C10.002 4.16606 10.1426 6.01763 9.18164 7.377L9.1582 7.40044C8.92383 7.752 8.43164 7.82231 8.10352 7.58794C7.77539 7.35356 7.68164 6.88481 7.93945 6.53325L7.96289 6.50981C8.50195 5.73638 8.4082 4.72856 7.75195 4.07231C7.02539 3.32231 5.83008 3.32231 5.08008 4.07231L2.45508 6.69731C1.72852 7.42388 1.72852 8.61919 2.45508 9.36919C3.11133 10.0254 4.14258 10.1192 4.89258 9.58013L4.91602 9.55669C5.26758 9.29888 5.73633 9.39263 5.9707 9.72075C6.20508 10.0489 6.13477 10.5176 5.80664 10.7754L5.75977 10.7989C4.42383 11.7598 2.57227 11.5958 1.40039 10.4239C0.0644531 9.11138 0.0644531 6.95513 1.40039 5.64263Z" fill="white"/>
                                    </svg>
                                    <span>Макет</span>
                                </a>`
                                : ""
                        }
                    </div>
                </div>
                <div class="task__status" data-status="${task.status}">${STATUS_MAP[task.status]}</div>
            `;

            taskContainer.append(taskItem);
        });
    } else {
        const empty = document.createElement("div");
        empty.className = "task__empty";
        empty.innerHTML = `
            <h2 class="task__text-title">${MESSAGES.noTasks}</h2>
        `;
        taskContainer.append(empty);
    }
    startDeadlineTimers();
    taskContainer.classList.remove("loading");
};

const initInfiniteScroll = () => {
    const taskContainer = document.querySelector(".content__tasks");
    if (!taskContainer) return;

    let currentTarget = null;

    const handleScroll = () => {
        const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
        const scrollElement = isMobile ? document.documentElement : taskContainer;
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;

        if (scrollTop + clientHeight >= scrollHeight - CONFIG.SCROLL_THRESHOLD) {
            loadTasks(true);
        }
    };

    const updateScrollTarget = () => {
        if (currentTarget) {
            currentTarget.removeEventListener("scroll", handleScroll);
        }

        const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
        currentTarget = isMobile ? window : taskContainer;
        currentTarget.addEventListener("scroll", handleScroll);
    };

    updateScrollTarget();
    window.addEventListener("resize", updateScrollTarget);
};

export { loadTasks, sendToTelegram, renderTasks, initInfiniteScroll };