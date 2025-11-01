import { getCurrentUser } from "./store.js";
import { db, tasksRef } from "./firebase.js";
import { addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { loadTasks, sendToTelegram } from "./tasks.js";
import { handleDatepickerInput } from "./datepicker.js";
import { convertLinksToAnchors, copyToClipboard, validateFormFields, setButtonLoading } from "./utils.js";
import { handleModalBgEvents } from "./effects.js";
import { SELECTORS, MESSAGES, CONFIG, STATUS_TRANSITIONS } from "./constants.js";

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
    modalTitle.dataset.originalText = title;

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

    const modalBgWrapper = document.createElement("div");
    modalBgWrapper.className = "modal__bg-wrapper";
    const modalBg = document.createElement("div");
    modalBg.className = "modal__bg";
    modalBgWrapper.append(modalBg);

    modalHeader.append(modalTitle, modalClose);
    modalContainer.append(modalHeader, modalContent, modalBgWrapper);
    modal.append(modalContainer);
    document.body.append(modal);
    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (!e.target || e.target.closest(SELECTORS.modalContainer)) return;
        closeModal(e);
    });
    handleModalBgEvents(modalContainer, modalBg);
    setTimeout(() => (modal.dataset.active = "true"), 0);
    return modal;
};

const closeModal = (e) => {
    const target = e.target;
    if (!target) return;
    const modal = target.closest(SELECTORS.modal);
    if (!modal) return;
    modal.dataset.active = "false";
    setTimeout(() => {
        modal.remove();
        window.removeEventListener("resize", modal._handleResize);
    }, CONFIG.TRANSITION_DELAY);
};

const handleTaskSubmit = async (e, id = null, currentStatus = "created") => {
    e.preventDefault();

    const titleInput = document.querySelector(SELECTORS.addTaskTitle);
    const descriptionInput = document.querySelector(SELECTORS.addTaskDescription);
    const createdByInput = document.querySelector(SELECTORS.addTaskCreatedBy);
    const deadlineInput = document.querySelector(SELECTORS.addTaskDeadline);
    const tzLinkInput = document.querySelector(SELECTORS.addTaskTzLink);
    const figmaLinkInput = document.querySelector(SELECTORS.addTaskFigmaLink);

    const requiredFields = [titleInput, descriptionInput, createdByInput, deadlineInput];
    if (!validateFormFields(requiredFields)) return;

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const createdBy = createdByInput.value.trim();
    const tzLink = tzLinkInput?.value.trim() || "";
    const figmaLink = figmaLinkInput?.value.trim() || "";
    const deadLine = deadlineInput.value.trim();
    const deadLineConverted = deadLine.split(".").reverse().join("-");

    const submitBtn = e.submitter;
    setButtonLoading(submitBtn, true);

    const task = {
        title,
        description,
        createdBy,
        tzLink,
        figmaLink,
        createdAt: new Date().toISOString(),
        status: currentStatus,
        deadLine: deadLineConverted,
        company: getCurrentUser()?.login || "",
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

const updateTaskStatus = async (e, id, status) => {
    const btn = e.currentTarget;
    setButtonLoading(btn, true);
    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, {
        status,
        ...(status === "in_progress" ? { startedAt: new Date().toISOString() } : { finishedAt: new Date().toISOString() }),
    });
    loadTasks();
    closeModal(e);
};

const attachModalActions = (modal, content, task) => {
    const modalContent = modal.querySelector(".modal__content");
    const modalTitle = modal.querySelector(".modal__title");
    const modalHeader = modal.querySelector(".modal__header");

    const handleResize = () => {
        modalContent.style.paddingTop = modalHeader.offsetHeight + "px";
    };

    window.addEventListener("resize", handleResize);
    modal._handleResize = handleResize;
    handleResize();

    const oldTitle = modalTitle.innerText;
    const status = STATUS_TRANSITIONS[task.status] || STATUS_TRANSITIONS.in_progress;
    const copyBtns = content.querySelectorAll(SELECTORS.btnCopy);
    if (copyBtns.length) copyBtns.forEach((btn) => btn.addEventListener("click", () => copyToClipboard(btn.dataset.url || "")));

    const acceptBtn = content.querySelector(SELECTORS.taskAccept);
    if (acceptBtn) acceptBtn.addEventListener("click", (e) => updateTaskStatus(e, task.id, status));

    const editBtn = content.querySelector(SELECTORS.taskEdit);
    if (editBtn) {
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
            modalTitle.innerText = MESSAGES.editTask;

            editForm.addEventListener("submit", (e) => handleTaskSubmit(e, task.id));
            editForm.querySelector(SELECTORS.taskFormCancel)?.addEventListener("click", () => {
                const restoredContent = createTaskContent(task);
                modalContent.innerHTML = "";
                modalContent.append(restoredContent);
                modalTitle.innerText = oldTitle;
                attachModalActions(modal, restoredContent, task);
            });

            handleDatepickerInput(editForm);
            editForm.querySelectorAll(SELECTORS.taskFormInput).forEach((input) => {
                input.addEventListener("input", () => {
                    if (input.classList.contains("error") && input.value.trim() !== "") input.classList.remove("error");
                });
            });
        });
    }

    const deleteBtn = content.querySelector(SELECTORS.taskDelete);
    if (deleteBtn) {
        deleteBtn.addEventListener("click", async (ev) => {
            setButtonLoading(deleteBtn, true);
            const taskRef = doc(db, "tasks", task.id);
            await deleteDoc(taskRef);
            loadTasks();
            closeModal(ev);
        });
    }

    const showMoreBtn = content.querySelector(SELECTORS.btnShowMore);
    if (showMoreBtn) {
        showMoreBtn.addEventListener("click", (e) => {
            const target = e.target;
            const additionalContainer = target.closest(SELECTORS.taskFullAdditional);
            if (!additionalContainer) return;
            additionalContainer.dataset.active = additionalContainer.dataset.active === "true" ? "false" : "true";
        });

        modal.addEventListener("click", (ev) => {
            const isInside = ev.target.closest(SELECTORS.taskFullAdditionalContent);
            const isButton = ev.target.closest(SELECTORS.btnShowMore);
            const additional = modal.querySelector(`${SELECTORS.taskFullAdditional}[data-active='true']`);
            if (additional && !isInside && !isButton) additional.dataset.active = "false";
        });
    }
};

export { createTaskContent, createTaskForm, insertModal, closeModal, handleTaskSubmit, updateTaskStatus, attachModalActions };