import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

let currentStatus = "all";

const loadTasks = async () => {
    const taskContainer = document.querySelector(".content__tasks");
    if (taskContainer) taskContainer.classList.add("loading");
    const snapshot = await getDocs(tasksRef);
    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderTasks(tasks);
};

const sendToTelegram = (task) => {
    const text = `
Новая задача:
${task.title}
${task.description}
От: ${task.createdBy}
Figma: ${task.figmaLink || "—"}
ТЗ: ${task.tzLink || "—"}
${new Date(task.createdAt).toLocaleString()}
            `;
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text }),
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
    modalClose.className = "modal__close";
    modalClose.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5133 2.73323L10.2715 7.97504L15.5133 13.2668C16.1622 13.8658 16.1622 14.9142 15.5133 15.5133C14.9142 16.1622 13.8658 16.1622 13.2668 15.5133L8.02496 10.2715L2.73323 15.5133C2.13417 16.1622 1.0858 16.1622 0.486739 15.5133C-0.162246 14.9142 -0.162246 13.8658 0.486739 13.2668L5.72855 7.97504L0.486739 2.73323C-0.162246 2.13417 -0.162246 1.0858 0.486739 0.486739C1.0858 -0.162246 2.13417 -0.162246 2.73323 0.486739L8.02496 5.72855L13.2668 0.486739C13.8658 -0.162246 14.9142 -0.162246 15.5133 0.486739C16.1622 1.0858 16.1622 2.13417 15.5133 2.73323Z" fill="white"/>
        </svg>
    `;

    const modalContent = document.createElement("div");
    modalContent.className = "modal__content";
    modalContent.append(content);

    modalHeader.append(modalTitle, modalClose);
    modalContainer.append(modalHeader, modalContent);
    modal.append(modalContainer);
    document.body.append(modal);

    modal.addEventListener("click", (e) => {
        const target = e.target;
        if (!target || target.closest(".modal__container")) return;

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

const handleAdd = () => {
    document.querySelector(".content__header-add")?.addEventListener("click", () => {
        const addForm = buildTaskForm();
        insertModal(addForm, "Добавить задачу");

        addForm.addEventListener("submit", submitTask);
        addForm.querySelector(".task__form-cancel").addEventListener("click", closeModal);
    });
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

const createTaskContent = (taskId, taskDescr, taskCreatedBy, taskLinkT, taskLinkF, taskStatus) => {
    const content = document.createElement("div");
    content.className = "task__full";
    content.dataset.id = taskId;
    content.innerHTML = `
        <p class="task__full-description">${taskDescr}</p>
        <div class="task__full-links">
            ${taskLinkT ? `<a href="${taskLinkT}" class="task__link task__full-link-t" target="_blank">Смотреть ТЗ</a>` : ""}
            ${taskLinkF ? `<a href="${taskLinkF}" class="task__link task__full-link-f" target="_blank">Смотреть макет</a>` : ""}
        </div>
        <p class="task__full-createdBy">Автор: <span>${taskCreatedBy}</span></p>
        <div class="task__form-actions">
            ${
                taskStatus !== "done"
                    ? `<button class="task__accept ${taskStatus === "created" ? "btn" : "btn btn__green"}">${taskStatus === "created" ? "Начать задачу" : "Завершить задачу"}</button>`
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
                    <button class="task__edit btn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.4" d="M9.49219 2.43876L11.3383 0.594057C11.745 0.187597 12.2457 0 12.7776 0C13.2782 0 13.7789 0.187597 14.1856 0.594057L15.4059 1.81344C15.8127 2.2199 16.0005 2.72016 16.0005 3.22042C16.0005 3.75194 15.8127 4.2522 15.4059 4.65866C14.7802 5.28398 14.1544 5.90931 13.5599 6.50337C12.1831 5.15892 10.8376 3.81447 9.49219 2.43876Z" fill="white"/>
                            <path d="M13.5594 6.50406L5.70568 14.3519C5.51794 14.5395 5.23634 14.6958 4.95473 14.7896L0.949643 15.9777C0.699325 16.0402 0.417718 15.9777 0.229979 15.7588C0.0109514 15.5712 -0.051628 15.2899 0.0422411 15.0397L1.19996 11.0377C1.29383 10.7563 1.45028 10.4749 1.63802 10.2873L9.49174 2.43945L13.5594 6.50406Z" fill="white"/>
                        </svg>
                        <span>Редактировать</span>
                    </button>
                    <div class="divider"></div>
                    <button class="task__delete btn">
                        <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.4" d="M1 3H13L12.3125 14.5938C12.2813 15.4063 11.625 16 10.8125 16H3.15625C2.34375 16 1.6875 15.4063 1.65625 14.5938L1 3Z" fill="white"/>
                            <path d="M5.09375 0H8.875C9.25 0 9.59375 0.21875 9.75 0.5625L10 1H13C13.5313 1 14 1.46875 14 2C14 2.5625 13.5313 3 13 3H1C0.4375 3 0 2.5625 0 2C0 1.46875 0.4375 1 1 1H4L4.21875 0.5625C4.375 0.21875 4.71875 0 5.09375 0Z" fill="white"/>
                        </svg>
                        <span>Удалить</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    return content;
};

const attachModalActions = (modal, content, taskId, taskStatus) => {
    const modalContent = modal.querySelector(".modal__content");
    const modalTitle = modal.querySelector(".modal__title");
    const oldTitle = modalTitle.innerText;
    const status = taskStatus === "created" ? "in_progress" : "done";
    const acceptBtn = content.querySelector(".task__accept");
    if (acceptBtn) acceptBtn.addEventListener("click", (e) => updateTaskStatus(e, taskId, status));

    const editBtn = content.querySelector(".task__edit");
    editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const values = {
            title: modalTitle.innerText,
            description: content.querySelector(".task__full-description")?.innerText || "",
            createdBy: content.querySelector(".task__full-createdBy span")?.innerText || "",
            tzLink: content.querySelector(".task__full-link-t")?.href || "",
            figmaLink: content.querySelector(".task__full-link-f")?.href || "",
        };
        const editForm = buildTaskForm(values, true);
        modalContent.innerHTML = "";
        modalContent.append(editForm);
        modalTitle.innerText = "Изменить задачу";
        editForm.addEventListener("submit", (ev) => updateTask(ev, taskId));
        editForm.querySelector(".task__form-cancel")?.addEventListener("click", () => {
            const restoredContent = createTaskContent(
                taskId,
                content.querySelector(".task__full-description")?.innerText || "",
                content.querySelector(".task__full-createdBy span")?.innerText || "",
                content.querySelector(".task__full-link-t")?.href || "",
                content.querySelector(".task__full-link-f")?.href || "",
                taskStatus
            );
            modalContent.innerHTML = "";
            modalContent.append(restoredContent);
            modalTitle.innerText = oldTitle;
            attachModalActions(modal, restoredContent, taskId, taskStatus);
        });
    });

    const deleteBtn = content.querySelector(".task__delete");
    deleteBtn.addEventListener("click", async (ev) => {
        deleteBtn.classList.add("loading");
        deleteBtn.disabled = true;

        const taskRef = doc(db, "tasks", taskId);
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
};

const buildTaskForm = (values = {}, isEdit = false) => {
    const { title = "", description = "", createdBy = "", tzLink = "", figmaLink = "" } = values;

    const form = document.createElement("form");
    form.className = "task__form";
    form.innerHTML = `
        <div class="task__form-group">
            <label for="add-task__title">Название задачи</label>
            <input type="text" id="add-task__title" class="task__form-input" placeholder="Например: Сверстать главную страницу" value="${title}" autocomplete="off" required />
        </div>
        <div class="task__form-group">
            <label for="add-task__description">Описание задачи</label>
            <textarea id="add-task__description" class="task__form-input" placeholder="Кратко опиши, что нужно сделать" rows="8" required>${description}</textarea>
        </div>
        <div class="task__form-group">
            <label for="add-task__tzLink">Ссылка на ТЗ</label>
            <input type="url" id="add-task__tzLink" class="task__form-input" placeholder="https://..." value="${tzLink}" autocomplete="off" />
        </div>
        <div class="task__form-group">
            <label for="add-task__figmaLink">Ссылка на макет</label>
            <input type="url" id="add-task__figmaLink" class="task__form-input" placeholder="https://www.figma.com/..." value="${figmaLink}" autocomplete="off" />
        </div>
        <div class="task__form-group">
            <label for="add-task__createdBy">Кто поставил задачу</label>
            <input type="text" id="add-task__createdBy" class="task__form-input" placeholder="Например: Аня" value="${createdBy}" autocomplete="off" required />
        </div>
        <div class="task__form-actions">
            <button type="submit" class="task__form-submit btn">${isEdit ? "Сохранить" : "Добавить"}</button>
            <button type="button" class="task__form-cancel btn btn__red">Отмена</button>
        </div>
    `;

    return form;
};

const convertLinksToAnchors = (text) => {
    return text.replace(/(?<!href="|">)((https?:\/\/|www\.)[^\s<>()\]]+[^\s<>,.?!:;()\]])/gi, (match) => {
        let url = match;

        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }

        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
};

const handleTaskClick = () => {
    document.querySelectorAll(".task").forEach((taskItem) => {
        taskItem.addEventListener("click", (e) => {
            if (e.target.closest(".task__link")) return;

            const taskId = taskItem.dataset.id || "";
            const taskTitle = taskItem.querySelector(".task__top-title")?.innerText || "";
            const taskDescrRaw = taskItem.querySelector(".task__top-description")?.innerHTML || "";
            const taskDescr = convertLinksToAnchors(taskDescrRaw);
            const taskCreatedBy = taskItem.querySelector(".task__created-by span")?.innerText || "";
            const taskLinkT = taskItem.querySelector(".task__link-t")?.href || "";
            const taskLinkF = taskItem.querySelector(".task__link-f")?.href || "";
            const taskStatus = taskItem.querySelector(".task__status")?.getAttribute("data-status") || "";

            const content = createTaskContent(taskId, taskDescr, taskCreatedBy, taskLinkT, taskLinkF, taskStatus);
            insertModal(content, taskTitle);

            const modal = document.querySelector(".modal");
            attachModalActions(modal, content, taskId, taskStatus);
        });
    });
};

const submitTask = async (e) => {
    e.preventDefault();

    const title = document.querySelector("#add-task__title").value.trim();
    const description = document.querySelector("#add-task__description").value.trim();
    const createdBy = document.querySelector("#add-task__createdBy").value.trim();
    const tzLink = document.querySelector("#add-task__tzLink").value.trim();
    const figmaLink = document.querySelector("#add-task__figmaLink").value.trim();

    if (!title || !description || !createdBy) return;

    const task = {
        title,
        description,
        status: "created",
        createdBy,
        tzLink,
        figmaLink,
        createdAt: new Date().toISOString(),
    };

    const submitBtn = e.submitter;
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    await addDoc(tasksRef, task);
    sendToTelegram(task);
    e.target.reset();

    closeModal(e);
    loadTasks();
};

const updateTask = async (e, id, status = "created") => {
    e.preventDefault();

    const title = document.querySelector("#add-task__title")?.value.trim();
    const description = document.querySelector("#add-task__description")?.value.trim();
    const createdBy = document.querySelector("#add-task__createdBy")?.value.trim();
    const tzLink = document.querySelector("#add-task__tzLink")?.value.trim();
    const figmaLink = document.querySelector("#add-task__figmaLink")?.value.trim();

    if (!title || !description || !createdBy) return;

    const task = {
        title,
        description,
        status,
        createdBy,
        tzLink,
        figmaLink,
        changedAt: new Date().toISOString(),
    };

    const submitBtn = e.submitter;
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, task);

    if (e && e.target) {
        closeModal(e);
    }
    loadTasks();
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
    const status = currentStatus;
    titleEl.textContent = statusMap[status] || "Все задачи";
    document.querySelectorAll(".sidebar__link").forEach((link) => {
        if (link.dataset.status === status) {
            link.dataset.active = "true";
        } else {
            link.dataset.active = "false";
        }
    });

    const statusFilter = status;
    const filteredTasks = tasks.filter((task) => {
        if (!statusFilter || statusFilter === "all") return true;
        return task.status === statusFilter;
    });

    if (filteredTasks.length > 0) {
        filteredTasks.forEach((task) => {
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
                        <p class="task__top-description">${task.description}</p>
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
    container.classList.remove("loading");
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

window.addEventListener("DOMContentLoaded", () => {
    handleFilters();
    handleAdd();
    loadTasks();
});
