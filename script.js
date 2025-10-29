import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, limit, query, orderBy, startAfter, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let appInitialized = false;
let currentUser = null;

const checkUserAuth = () => {
    const userData = localStorage.getItem("user");
    const pageContainer = document.querySelector(".page__container");

    if (!userData) {
        pageContainer?.classList.add("hidden");
        renderLoginForm();
    } else {
        pageContainer?.classList.remove("hidden");
        currentUser = JSON.parse(userData);
        initApp();
    }
};

const renderLoginForm = () => {
    const container = document.createElement("div");
    container.className = "login";
    container.innerHTML = `
        <form class="login__form">
            <h1 class="login__title">Вход</h1>
            <div class="login__form-group">
                <input type="text" class="login__input" id="login" placeholder="Логин" autocomplete="off" />
                <input type="password" class="login__input" id="password" placeholder="Пароль" autocomplete="off" />
            </div>
            <button type="submit" class="btn login__submit">Войти</button>
            <p class="login__error"></p>
        </form>
    `;

    document.body.appendChild(container);

    const form = container.querySelector(".login__form");
    form.addEventListener("submit", (e) => handleLogin(e));
};

const handleLogin = async (e) => {
    e.preventDefault();
    const submitBtn = e.submitter;
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    const loginInput = e.target.querySelector("#login");
    const passwordInput = e.target.querySelector("#password");
    const errorEl = e.target.querySelector(".login__error");

    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();

    if (!login || !password) {
        errorEl.textContent = "Введите логин и пароль";
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        return;
    }

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const user = users.find((u) => u.login === login);

    if (!user) {
        errorEl.textContent = "Пользователь не найден";
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        return;
    }

    if (user.password !== password) {
        errorEl.textContent = "Неверный пароль";
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        return;
    }

    localStorage.setItem("user", JSON.stringify({ login: user.login, role: user.role }));
    currentUser = user;
    initApp();
    document.querySelector(".login")?.remove();
    document.querySelector(".page__container")?.classList.remove("hidden");
};

const logoutUser = () => {
    localStorage.removeItem("user");
    location.reload();
};

const firebaseConfig = {
    apiKey: "AIzaSyDur-_Gm0ZQOhdNwlzX5Aea-FSMXnXfyOM",
    authDomain: "tasks-cifrium.firebaseapp.com",
    projectId: "tasks-cifrium",
    storageBucket: "tasks-cifrium.firebasestorage.app",
    messagingSenderId: "969489877277",
    appId: "1:969489877277:web:4b22747d40819df432b9f4",
    measurementId: "G-8BM9F20HJM",
};

const BOT_TOKEN = "7399906374:AAEZt86SEiN8vqwqpeXwf-foSmrpNNuQu60";
const CHAT_ID = "262304440";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tasksRef = collection(db, "tasks");

let deadlineTimerInterval;
let allTasks = [];
let isLoading = false;
let hasMore = true;
let lastVisible = null;

const loadTasks = async (isNextPage = false) => {
    if (isLoading || (!hasMore && isNextPage)) return;
    isLoading = true;

    const taskContainer = document.querySelector(".content__tasks");
    if (taskContainer) taskContainer.classList.add("loading");

    let q;
    if (currentUser?.role === "admin") {
        q = !isNextPage ? query(tasksRef, orderBy("createdAt", "desc"), limit(10)) : query(tasksRef, orderBy("createdAt", "desc"), startAfter(lastVisible), limit(10));
    } else {
        const companyFilter = currentUser?.login || "";
        q = !isNextPage
            ? query(tasksRef, where("company", "==", companyFilter), orderBy("createdAt", "desc"), limit(10))
            : query(tasksRef, where("company", "==", companyFilter), orderBy("createdAt", "desc"), startAfter(lastVisible), limit(10));
    }

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (snapshot.docs.length > 0) {
        lastVisible = snapshot.docs[snapshot.docs.length - 1];

        if (!isNextPage) {
            allTasks = tasks;
        } else {
            allTasks = [...allTasks, ...tasks];
        }

        renderTasks(allTasks);
    } else {
        hasMore = false;
    }

    if (taskContainer) taskContainer.classList.remove("loading");
    isLoading = false;
};

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

const renderTasks = (tasks) => {
    const container = document.querySelector(".content__tasks");
    container.innerHTML = "";
    const today = new Date().toISOString().split("T")[0];

    const titleEl = document.querySelector(".content__header-title");
    const statusMap = {
        all: "Все задачи",
        done: "Выполнено",
        in_progress: "В процессе",
        created: "Не начато",
    };

    titleEl.textContent = "Все задачи";

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
                <div class="task__status" data-status="${task.status}">${statusMap[task.status]}</div>
            `;

            container.append(taskItem);
        });
    } else {
        const empty = document.createElement("div");
        empty.className = "task__empty";
        empty.innerHTML = `
            <h2 class="task__text-title">Пока нет задач</h2>
        `;
        container.append(empty);
    }
    handleTaskClick();
    startDeadlineTimers();
    container.classList.remove("loading");
};

const createTaskContent = (task) => {
    const content = document.createElement("div");
    content.className = "task__full";
    content.dataset.id = task.id;

    const descrWithLinks = convertLinksToAnchors(task.description || "");
    content.innerHTML = `
        <p class="task__full-description">${descrWithLinks}</p>
        <div class="task__full-links">
            ${task.tzLink ? `<a href="${task.tzLink}" class="task__link task__full-link-t" target="_blank">Смотреть ТЗ</a>` : ""}
            ${task.figmaLink ? `<a href="${task.figmaLink}" class="task__link task__full-link-f" target="_blank">Смотреть макет</a>` : ""}
        </div>
        <p class="task__full-createdBy">Автор: <span>${task.createdBy || ""}</span></p>
        <div class="task__form-actions">
            ${
                task.status !== "done"
                    ? `<button class="task__accept ${task.status === "created" ? "btn" : "btn btn__green"}">${task.status === "created" ? "Начать задачу" : "Завершить задачу"}</button>`
                    : ""
            }
            <div class="task__full-additional">
                <button class="btn btn__show-more">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="3" cy="8" r="1.5" fill="white"/>
                        <circle cx="8" cy="8" r="1.5" fill="white"/>
                        <circle cx="13" cy="8" r="1.5" fill="white"/>
                    </svg>
                </button>
                <div class="task__full-additional-content" data-active="false">
                    <button class="task__edit btn">Редактировать</button>
                    <button class="task__delete btn">Удалить</button>
                </div>
            </div>
        </div>
    `;
    return content;
};

const createTaskForm = (values = {}, isEdit = false) => {
    const { title = "", description = "", createdBy = "", tzLink = "", figmaLink = "", deadLine = "" } = values;

    const deadLineStringRu = deadLine ? deadLine.split("-").reverse().join(".") : "";

    const form = document.createElement("form");
    form.className = "task__form";
    form.innerHTML = `
        <div class="task__form-group">
            <input type="text" id="add-task__title" class="task__form-input" placeholder="Название задачи" value="${title}" autocomplete="off" />
            <textarea id="add-task__description" class="task__form-input" placeholder="Описание задачи" rows="6">${description}</textarea>
            <div class="task__form-group-deadline">
                <input type="text" id="add-task__deadline" class="task__form-input task__form-datepicker" placeholder="Отдать до" data-deadline="${deadLine}" value="${deadLineStringRu}" autocomplete="off" readonly />
            </div>
            <input type="text" id="add-task__createdBy" class="task__form-input" placeholder="Кто поставил задачу" value="${createdBy}" autocomplete="off" />
            <input type="url" id="add-task__tzLink" class="task__form-input" placeholder="Ссылка на ТЗ" value="${tzLink}" autocomplete="off" />
            <input type="url" id="add-task__figmaLink" class="task__form-input" placeholder="Ссылка на макет" value="${figmaLink}" autocomplete="off" />
        </div>
        <div class="task__form-actions">
            <button type="submit" class="task__form-submit btn">${isEdit ? "Сохранить" : "Добавить"}</button>
            <button type="button" class="task__form-cancel btn btn__red">Отмена</button>
        </div>
    `;
    return form;
};

const handleTaskSubmit = async (e, id = null, currentStatus = "created") => {
    e.preventDefault();

    const titleInput = document.querySelector("#add-task__title");
    const descriptionInput = document.querySelector("#add-task__description");
    const createdByInput = document.querySelector("#add-task__createdBy");
    const deadlineInput = document.querySelector("#add-task__deadline");
    const tzLinkInput = document.querySelector("#add-task__tzLink");
    const figmaLinkInput = document.querySelector("#add-task__figmaLink");

    const requiredFields = [titleInput, descriptionInput, createdByInput, deadlineInput];

    let hasError = false;

    requiredFields.forEach((input) => {
        if (!input) return;
        const value = input.value.trim();
        if (!value) {
            input.classList.add("error");
            hasError = true;
        } else {
            input.classList.remove("error");
        }
    });

    if (hasError) return;

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const createdBy = createdByInput.value.trim();
    const tzLink = tzLinkInput?.value.trim() || "";
    const figmaLink = figmaLinkInput?.value.trim() || "";
    const deadLine = deadlineInput.value.trim();
    const deadLineConverted = deadLine.split(".").reverse().join("-");

    const submitBtn = e.submitter;
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    const task = {
        title,
        description,
        createdBy,
        tzLink,
        figmaLink,
        createdAt: new Date().toISOString(),
        status: currentStatus,
        deadLine: deadLineConverted,
        company: currentUser?.login || "",
    };

    if (id) {
        const taskRef = doc(db, "tasks", id);
        await updateDoc(taskRef, task);
    } else {
        await addDoc(tasksRef, task);
        sendToTelegram(task);
        e.target.reset();
    }

    loadTasks();
    closeModal(e);
};

const handleBtns = () => {
    const updateBtn = document.querySelector(".content__header-update");
    if (updateBtn) {
        updateBtn.addEventListener("click", () => {
            allTasks = [];
            lastVisible = null;
            hasMore = true;
            loadTasks(false);
        });
    }

    const logoutBtn = document.querySelector(".content__header-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }
};

const initApp = () => {
    if (appInitialized) return;
    appInitialized = true;

    handleBtns();
    handleFilters();
    handleAdd();
    loadTasks();
    initInfiniteScroll();
};

const updateTaskStatus = async (e, id, status) => {
    const btn = e.currentTarget;
    btn.classList.add("loading");
    btn.disabled = true;
    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, {
        status,
        ...(status === "in_progress" ? { startedAt: new Date().toISOString() } : { finishedAt: new Date().toISOString() }),
    });
    loadTasks();
    closeModal(e);
};

const handleTaskClick = () => {
    document.querySelectorAll(".task").forEach((taskItem) => {
        taskItem.addEventListener("click", (e) => {
            if (e.target.closest(".task__link")) return;

            const taskId = taskItem.dataset.id || "";
            const task = allTasks.find((t) => t.id === taskId);
            if (!task) return;

            const content = createTaskContent(task);
            insertModal(content, task.title || "");
            const modal = document.querySelector(".modal");
            attachModalActions(modal, content, task);
        });
    });
};

const handleAdd = () => {
    document.querySelector(".content__header-add")?.addEventListener("click", () => {
        const userData = localStorage.getItem("user");
        if (!userData) {
            checkUserAuth();
            return;
        }
        currentUser = JSON.parse(userData);
        const addForm = createTaskForm();
        insertModal(addForm, "Добавить задачу");

        addForm.addEventListener("submit", (e) => handleTaskSubmit(e));
        addForm.querySelector(".task__form-cancel").addEventListener("click", closeModal);

        handleDatepickerInput(addForm);
        addForm.querySelectorAll(".task__form-input").forEach((input) => {
            input.addEventListener("input", () => {
                if (input.classList.contains("error") && input.value.trim() !== "") {
                    input.classList.remove("error");
                }
            });
        });
    });
};

const insertModal = (content, title = "Добавить задачу") => {
    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContainer = document.createElement("div");
    modalContainer.className = "modal__container";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal__header";

    const modalTitle = document.createElement("h1");
    modalTitle.className = "modal__title";
    modalTitle.textContent = title;

    const modalClose = document.createElement("button");
    modalClose.className = "modal__close btn";
    modalClose.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.280428 15.7196C0.155794 15.5949 0.0727037 15.4469 0.0311587 15.2756C-0.0103862 15.1094 -0.0103862 14.9406 0.0311587 14.7692C0.0727037 14.6031 0.153197 14.4628 0.272639 14.3486L6.62123 8L0.272639 1.65141C0.153197 1.53716 0.0727037 1.39695 0.0311587 1.23077C-0.0103862 1.06459 -0.0103862 0.895813 0.0311587 0.72444C0.0727037 0.553067 0.155794 0.405063 0.280428 0.280428C0.405063 0.155794 0.550471 0.0727037 0.71665 0.0311587C0.888023 -0.0103862 1.0568 -0.0103862 1.22298 0.0311587C1.38916 0.0727037 1.53457 0.153197 1.6592 0.272639L8 6.62123L14.3408 0.280428C14.4654 0.155794 14.6108 0.0727037 14.777 0.0311587C14.9432 -0.0103862 15.1094 -0.0103862 15.2756 0.0311587C15.4417 0.0727037 15.5871 0.155794 15.7118 0.280428C15.8416 0.405063 15.9273 0.553067 15.9688 0.72444C16.0104 0.89062 16.0104 1.0568 15.9688 1.22298C15.9273 1.38916 15.8442 1.53457 15.7196 1.6592L9.37877 8L15.7196 14.3408C15.8442 14.4654 15.9247 14.6082 15.9611 14.7692C16.0026 14.9354 16.0026 15.1016 15.9611 15.2678C15.9247 15.4391 15.8416 15.5897 15.7118 15.7196C15.5871 15.8442 15.4417 15.9273 15.2756 15.9688C15.1094 16.0104 14.9432 16.0104 14.777 15.9688C14.6108 15.9273 14.4654 15.8442 14.3408 15.7196L8 9.37877L1.6592 15.7274C1.53457 15.8468 1.38916 15.9273 1.22298 15.9688C1.0568 16.0104 0.89062 16.0104 0.72444 15.9688C0.55826 15.9273 0.410256 15.8442 0.280428 15.7196Z" fill="white"/>
        </svg>
    `;

    const modalContent = document.createElement("div");
    modalContent.className = "modal__content";
    modalContent.append(content);

    modalHeader.append(modalTitle, modalClose);
    modalContainer.append(modalHeader, modalContent);
    modal.append(modalContainer);

    const modalBgWrapper = document.createElement("div");
    modalBgWrapper.className = "modal__bg-wrapper";

    const modalBg = document.createElement("div");
    modalBg.className = "modal__bg";
    modalBgWrapper.append(modalBg);

    modalContainer.append(modalBgWrapper);

    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const handleMove = (e) => {
        const point = e.touches?.[0] || e;
        if (!point) return;
        if (isTouch) e.preventDefault();

        if (e.target.closest(".task__full-additional-content") || e.target.closest(".datepicker")) {
            modalBg.style.opacity = "";
            return;
        } else {
            modalBg.style.opacity = "1";
        }

        const rect = modalContainer.getBoundingClientRect();
        const bgRect = modalBg.getBoundingClientRect();
        const x = point.clientX - rect.left - bgRect.width / 2;
        const y = point.clientY - rect.top - bgRect.height / 2;
        modalBg.style.transform = `translate(${x}px, ${y}px)`;
    };

    if (isTouch) {
        modalContainer.addEventListener(
            "touchstart",
            () => {
                modalBg.style.opacity = "1";
            },
            { passive: false }
        );

        modalContainer.addEventListener("touchmove", handleMove, { passive: false });

        modalContainer.addEventListener("touchend", () => {
            modalBg.style.opacity = "";
        });
    } else {
        modalContainer.addEventListener("mouseenter", () => {
            modalBg.style.opacity = "1";
        });

        modalContainer.addEventListener("mousemove", handleMove);

        modalContainer.addEventListener("mouseleave", () => {
            modalBg.style.opacity = "";
        });
    }

    document.body.append(modal);

    modal.addEventListener("click", (e) => {
        if (!e.target || e.target.closest(".modal__container")) return;
        closeModal(e);
    });
    modalClose.addEventListener("click", (e) => closeModal(e));

    setTimeout(() => {
        modal.dataset.active = "true";
    }, 0);
};

const closeModal = (e) => {
    const target = e.target;
    if (!target) return;
    const modal = target.closest(".modal");
    if (!modal) return;
    modal.dataset.active = "false";
    setTimeout(() => {
        modal.remove();
    }, 300);
};

const attachModalActions = (modal, content, task) => {
    const modalContent = modal.querySelector(".modal__content");
    const modalTitle = modal.querySelector(".modal__title");
    const oldTitle = modalTitle.innerText;
    const status = task.status === "created" ? "in_progress" : "done";
    const acceptBtn = content.querySelector(".task__accept");
    const copyBtns = content.querySelectorAll(".btn__copy");
    const modalContainer = modal.querySelector(".modal__container");
    if (copyBtns.length) {
        copyBtns.forEach((copyBtn) => {
            copyBtn.addEventListener("click", () => copyToClipboard(copyBtn.dataset.url || ""));
        });
    }
    if (acceptBtn) acceptBtn.addEventListener("click", (e) => updateTaskStatus(e, task.id, status));

    const editBtn = content.querySelector(".task__edit");
    editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const values = {
            title: task.title || "",
            description: task.description || "",
            createdBy: task.createdBy || "",
            tzLink: task.tzLink || "",
            figmaLink: task.figmaLink || "",
            deadLine: task.deadLine || "",
        };
        const editForm = createTaskForm(values, true);
        modalContent.innerHTML = "";
        modalContent.append(editForm);
        modalTitle.innerText = "Изменить задачу";
        editForm.addEventListener("submit", (e) => handleTaskSubmit(e, task.id));
        editForm.querySelector(".task__form-cancel")?.addEventListener("click", () => {
            const restoredContent = createTaskContent(task);
            modalContent.innerHTML = "";
            modalContent.append(restoredContent);
            modalTitle.innerText = oldTitle;
            attachModalActions(modal, restoredContent, task);
        });

        handleDatepickerInput(editForm);
        editForm.querySelectorAll(".task__form-input").forEach((input) => {
            input.addEventListener("input", () => {
                if (input.classList.contains("error") && input.value.trim() !== "") {
                    input.classList.remove("error");
                }
            });
        });
    });

    const deleteBtn = content.querySelector(".task__delete");
    deleteBtn.addEventListener("click", async (ev) => {
        deleteBtn.classList.add("loading");
        deleteBtn.disabled = true;

        const taskRef = doc(db, "tasks", task.id);
        await deleteDoc(taskRef);
        loadTasks();
        closeModal(ev);
    });

    const showMoreBtn = content.querySelector(".btn__show-more");
    if (showMoreBtn) {
        showMoreBtn.addEventListener("click", (e) => {
            const target = e.target;
            const additionalContainer = target.closest(".task__full-additional");
            if (!additionalContainer) return;
            additionalContainer.dataset.active = additionalContainer.dataset.active === "true" ? "false" : "true";
        });

        modal.addEventListener("click", (ev) => {
            const isInside = ev.target.closest(".task__full-additional-content");
            const isButton = ev.target.closest(".btn__show-more");

            const additional = modal.querySelector(".task__full-additional[data-active='true']");
            if (additional && !isInside && !isButton) {
                additional.dataset.active = "false";
            }
        });
    }
    if (modalContainer) {
        modalContainer.dataset.scroll = "false";
        modalContent.addEventListener("scroll", () => {
            if (modalContent.scrollTop > 0) {
                modalContainer.dataset.scroll = "true";
            } else {
                modalContainer.dataset.scroll = "false";
            }
        });
    }
};

const handleDatepickerInput = (container) => {
    const deadLineInputGroup = container.querySelector(".task__form-group-deadline");
    if (!deadLineInputGroup) return;

    const deadLineInput = deadLineInputGroup.querySelector(".task__form-datepicker");
    if (deadLineInput) {
        deadLineInput.addEventListener("click", () => handleDatepicker(deadLineInputGroup, deadLineInput));
    }
};

const handleDatepicker = (container, input) => {
    const stringDate = input.dataset?.deadline;
    const today = new Date();
    let [initYear, initMonth, initDay] = stringDate ? stringDate.split("-").map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
    let currentDate = new Date(initYear, initMonth - 1, initDay);
    let isOpened = false;

    const renderCalendar = (year, month) => {
        const selectedDate = new Date(currentDate);
        const realMonth = month;
        const dayLast = new Date(year, realMonth + 1, 0).getDate();
        const dayFirst = new Date(year, realMonth, 1).getDay();
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
        const monthName = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
        const datepicker = document.createElement("div");

        if (!isOpened) {
            datepicker.dataset.active = "false";
        } else {
            datepicker.dataset.active = "true";
        }

        datepicker.className = "datepicker";
        const table = document.createElement("table");
        table.className = "datepicker__table";
        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr class="datepicker__header">
                <th class="datepicker__title" colspan="5">${monthName[realMonth]} ${year}</th>
                <th>
                    <button class="datepicker__nav datepicker__prev">
                        <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.22807 6.60201C-0.0760234 6.28094 -0.0760234 5.71906 0.22807 5.39799L4.7193 0.26087C5 -0.0869566 5.49123 -0.0869565 5.77193 0.26087C6.07602 0.58194 6.07602 1.14381 5.77193 1.46488L1.81871 6.01338L5.77193 10.5351C6.07602 10.8562 6.07602 11.4181 5.77193 11.7391C5.49123 12.087 5 12.087 4.7193 11.7391L0.22807 6.60201Z" fill="white"/>
                        </svg>
                    </button>
                </th>
                <th>
                    <button class="datepicker__nav datepicker__next">
                        <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.77193 5.39799C6.07602 5.71906 6.07602 6.28094 5.77193 6.60201L1.2807 11.7391C1 12.087 0.508772 12.087 0.22807 11.7391C-0.0760234 11.4181 -0.0760234 10.8562 0.22807 10.5351L4.18129 5.98662L0.22807 1.46488C-0.0760234 1.14381 -0.0760234 0.58194 0.22807 0.26087C0.508772 -0.0869565 1 -0.0869565 1.2807 0.26087L5.77193 5.39799Z" fill="white"/>
                        </svg>
                    </button>
                </th>
            </tr>
            <tr class="datepicker__weekdays">
                <th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th>
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
                const dateObj = new Date(year, realMonth, 1);
                if (obj.type === "prev") dateObj.setMonth(realMonth - 1);
                if (obj.type === "next") dateObj.setMonth(realMonth + 1);
                dateObj.setDate(obj.day);
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
            setTimeout(() => {
                datepicker.dataset.active = "true";
            }, 0);
            isOpened = true;
        }

        thead.querySelector(".datepicker__prev").addEventListener("click", () => {
            const newMonth = new Date(year, realMonth - 1);
            renderCalendar(newMonth.getFullYear(), newMonth.getMonth());
        });
        thead.querySelector(".datepicker__next").addEventListener("click", () => {
            const newMonth = new Date(year, realMonth + 1);
            renderCalendar(newMonth.getFullYear(), newMonth.getMonth());
        });

        const handlePickerClick = (e) => {
            const target = e.target;
            if (!target) return;
            if (target.closest(".datepicker") || target.closest(".task__form-datepicker")) return;

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
};

const copyToClipboard = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);

    let clipboardContainer = document.querySelector(".clipboard");
    if (!clipboardContainer) {
        clipboardContainer = document.createElement("div");
        clipboardContainer.className = "clipboard";
        document.body.appendChild(clipboardContainer);
    }

    const clipboardItem = document.createElement("div");
    clipboardItem.className = "clipboard__item";
    clipboardItem.textContent = "Ссылка скопирована";
    clipboardContainer.appendChild(clipboardItem);

    setTimeout(() => {
        clipboardItem.style.opacity = "0";
        setTimeout(() => {
            clipboardItem.remove();
            const container = document.querySelector(".clipboard");
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 4000);
};

const escapeHTML = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

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

const handleFilters = () => {
    document.querySelectorAll(".sidebar__link").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            currentStatus = btn.dataset.status || "all";
            loadTasks();
        });
    });
};

const startDeadlineTimers = () => {
    clearInterval(deadlineTimerInterval);
    updateAllDeadlines();

    const now = new Date();
    const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

    setTimeout(() => {
        updateAllDeadlines();
        deadlineTimerInterval = setInterval(updateAllDeadlines, 60000);
    }, msToNextMinute);
};

const updateAllDeadlines = () => {
    document.querySelectorAll(".task__deadline").forEach((el) => {
        const deadline = el.dataset.deadline;
        const timeLeft = getTimeLeftToLocalMidnight(deadline);
        const span = el.querySelector("span");
        if (span) span.textContent = timeLeft;
    });
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

const initInfiniteScroll = () => {
    const container = document.querySelector(".content__tasks");
    if (!container) return;

    container.addEventListener("scroll", () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            loadTasks(true);
        }
    });
};

const handleHoverEffect = () => {
    const targets = [
        ".content__header-btns-group",
        ".modal__close",
        ".btn__show-more",
        ".task__form-submit",
        ".task__form-cancel",
        ".login__submit",
        ".content__header-add",
        ".task__full-additional-content",
        ".task__accept",
    ];
    const movePower = 18;
    const scalePowerX = 0.08;
    const scalePowerY = 0.08;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const handleStart = (e) => {
        const el = e.target.closest(targets.join(","));
        if (!el) return;
        if (isTouch) {
            el.style.transition = "none";
        } else {
            el._transitionTimeout = setTimeout(() => {
                el.style.transition = "none";
            }, 400);
        }
    };

    const handleMove = (e) => {
        const el = e.target.closest(targets.join(","));
        if (!el) return;

        const point = e.touches?.[0] || e;
        if (!point) return;

        if (isTouch) e.preventDefault();

        const r = el.getBoundingClientRect();
        const ix = (point.clientX - r.left) / r.width - 0.5;
        const iy = (point.clientY - r.top) / r.height - 0.5;
        const tx = (ix * r.width) / movePower;
        const ty = (iy * r.height) / movePower;
        const sx = 1 + Math.abs(ix) * scalePowerX - Math.abs(iy) * scalePowerY;
        const sy = 1 + Math.abs(iy) * scalePowerY - Math.abs(ix) * scalePowerX;
        el.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    };

    const handleEnd = (e) => {
        const el = e.target.closest(targets.join(","));
        if (!el) return;
        clearTimeout(el._transitionTimeout);
        el.style.transition = "";
        el.style.transform = "";
    };

    if (isTouch) {
        document.addEventListener("touchstart", handleStart, { passive: false });
        document.addEventListener("touchmove", handleMove, { passive: false });
        document.addEventListener("touchend", handleEnd, { passive: false });
    } else {
        document.addEventListener("mouseover", (e) => {
            const el = e.target.closest(targets.join(","));
            if (!el || el.contains(e.relatedTarget)) return;
            handleStart(e);
        });
        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseout", (e) => {
            const el = e.target.closest(targets.join(","));
            if (!el || el.contains(e.relatedTarget)) return;
            handleEnd(e);
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    checkUserAuth();
    handleHoverEffect();
});
