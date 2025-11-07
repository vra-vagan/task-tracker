import { state } from "../state/state.js";
import { Auth } from "../services/auth-service.js";
import { FirebaseService } from "../services/firebase-service.js";
import { TelegramService } from "../services/telegram-service.js";
import { UI } from "../ui/ui.js";
import { Modal } from "../ui/modal.js";
import { Datepicker } from "../ui/datepicker.js";
import { Utils } from "../utils/utils.js";

export const EventHandlers = {
    attachLoginHandlers(container) {
        const form = container.querySelector(".login__form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = e.submitter;
            const loginInput = e.target.querySelector("#login");
            const passwordInput = e.target.querySelector("#password");
            const errorEl = e.target.querySelector(".login__error");

            submitBtn.classList.add("loading");
            submitBtn.disabled = true;

            const login = loginInput.value.trim();
            const password = passwordInput.value.trim();

            if (!login || !password) {
                errorEl.textContent = "Введите логин и пароль";
                submitBtn.classList.remove("loading");
                submitBtn.disabled = false;
                return;
            }

            try {
                const user = await Auth.login(login, password);
                Auth.setUser(user);

                document.dispatchEvent(new CustomEvent("userLoggedIn"));

                container.remove();
                document.querySelector(".page__container")?.classList.remove("hidden");
            } catch (error) {
                errorEl.textContent = error.message;
                submitBtn.classList.remove("loading");
                submitBtn.disabled = false;
            }
        });
    },

    attachTaskClickHandlers() {
        document.querySelectorAll(".task").forEach((taskItem) => {
            taskItem.addEventListener("click", (e) => {
                if (e.target.closest(".task__link")) return;

                const taskId = taskItem.dataset.id;
                const task = state.allTasks.find((t) => t.id === taskId);
                if (!task) return;

                const content = UI.createTaskModal(task);
                const modal = Modal.open(content, task.title);
                this.attachModalHandlers(modal, content, task);
            });
        });
    },

    attachModalHandlers(modal, content, task) {
        const acceptBtn = content.querySelector(".task__accept");
        if (acceptBtn) {
            acceptBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const btn = e.currentTarget;
                btn.classList.add("loading");
                btn.disabled = true;

                const newStatus = task.status === "created" ? "in_progress" : "done";
                const updates = {
                    status: newStatus,
                    ...(newStatus === "in_progress" ? { startedAt: new Date().toISOString() } : { finishedAt: new Date().toISOString() }),
                };

                await FirebaseService.updateTask(task.id, updates);
                await FirebaseService.loadTasks();
                Modal.close(e);
            });
        }

        const editBtn = content.querySelector(".task__edit");
        if (editBtn) {
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();

                const modalContent = modal.querySelector(".modal__content");
                const modalTitle = modal.querySelector(".modal__title");
                const oldTitle = modalTitle.textContent;

                const values = {
                    title: task.title || "",
                    description: task.description || "",
                    createdBy: task.createdBy || "",
                    tzLink: task.tzLink || "",
                    figmaLink: task.figmaLink || "",
                    deadLine: task.deadLine || "",
                };

                const editForm = UI.createTaskForm(values, true);
                modalContent.innerHTML = "";
                modalContent.appendChild(editForm);
                modalTitle.textContent = "Изменить задачу";

                editForm.addEventListener("submit", async (e) => {
                    await this.handleTaskSubmit(e, "created", task);
                });

                editForm.querySelector(".task__form-cancel")?.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const restoredContent = UI.createTaskModal(task);
                    modalContent.innerHTML = "";
                    modalContent.appendChild(restoredContent);
                    modalTitle.textContent = oldTitle;
                    this.attachModalHandlers(modal, restoredContent, task);
                });

                Datepicker.attach(editForm);
                this.attachInputValidation(editForm);
            });
        }

        const deleteBtn = content.querySelector(".task__delete");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                deleteBtn.classList.add("loading");
                deleteBtn.disabled = true;
                await FirebaseService.deleteTask(task.id);
                await FirebaseService.loadTasks();
                Modal.close(e);
            });
        }

        const showMoreBtn = content.querySelector(".btn__show-more");
        if (showMoreBtn) {
            showMoreBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const additionalContainer = e.target.closest(".task__full-additional");
                if (!additionalContainer) return;
                const isActive = additionalContainer.dataset.active === "true";
                additionalContainer.dataset.active = isActive ? "false" : "true";
            });

            modal.addEventListener("click", (e) => {
                const isInside = e.target.closest(".task__full-additional-content");
                const isButton = e.target.closest(".btn__show-more");
                const additional = modal.querySelector(".task__full-additional[data-active='true']");
                if (additional && !isInside && !isButton) {
                    additional.dataset.active = "false";
                }
            });
        }

        const copyBtns = content.querySelectorAll(".btn__copy");
        copyBtns.forEach((btn) => {
            btn.addEventListener("click", () => Utils.copyToClipboard(btn.dataset.url));
        });
    },

    async handleTaskSubmit(e, currentStatus = "created", task = null) {
        e.preventDefault();
        const titleInput = document.querySelector("#add-task__title");
        const descriptionInput = document.querySelector("#add-task__description");
        const createdByInput = document.querySelector("#add-task__createdBy");
        const deadlineInput = document.querySelector("#add-task__deadline");
        const tzLinkInput = document.querySelector("#add-task__tzLink");
        const figmaLinkInput = document.querySelector("#add-task__figmaLink");
        const taskId = task ? task.id : null;

        const requiredFields = [titleInput, descriptionInput, createdByInput, deadlineInput];
        let hasError = false;

        requiredFields.forEach((input) => {
            if (!input) return;
            if (!input.value.trim()) {
                input.classList.add("error");
                hasError = true;
            } else {
                input.classList.remove("error");
            }
        });

        if (hasError) return;

        const submitBtn = e.submitter;
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;

        const taskData = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            createdBy: createdByInput.value.trim(),
            tzLink: tzLinkInput?.value.trim() || "",
            figmaLink: figmaLinkInput?.value.trim() || "",
            createdAt: new Date().toISOString(),
            status: currentStatus,
            deadLine: deadlineInput.value.trim().split(".").reverse().join("-"),
            company: task?.company || state.currentUser?.login || "",
        };

        if (taskId) {
            await FirebaseService.updateTask(taskId, taskData);
        } else {
            await FirebaseService.createTask(taskData);
            TelegramService.sendNotification(taskData);
        }

        await FirebaseService.loadTasks();
        Modal.close(e);
    },

    attachInputValidation(form) {
        form.querySelectorAll(".task__form-input").forEach((input) => {
            input.addEventListener("input", () => {
                if (input.classList.contains("error") && input.value.trim()) {
                    input.classList.remove("error");
                }
            });
        });
    },

    attachHeaderButtons() {
        const updateBtn = document.querySelector(".content__header-update");
        if (updateBtn) {
            updateBtn.addEventListener("click", () => {
                state.allTasks = [];
                state.lastVisible = null;
                state.hasMore = true;
                FirebaseService.loadTasks();
            });
        }

        const logoutBtn = document.querySelector(".content__header-logout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", Auth.logout);
        }

        const addBtn = document.querySelector(".content__header-add");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                if (!Auth.checkAuth()) {
                    const loginForm = UI.renderLoginForm();
                    this.attachLoginHandlers(loginForm);
                    return;
                }

                const addForm = UI.createTaskForm();
                Modal.open(addForm, "Добавить задачу");

                addForm.addEventListener("submit", (e) => this.handleTaskSubmit(e));
                addForm.querySelector(".task__form-cancel").addEventListener("click", (e) => {
                    e.stopPropagation();
                    Modal.close(e);
                });

                Datepicker.attach(addForm);
                this.attachInputValidation(addForm);
            });
        }
    },

    initInfiniteScroll() {
        const container = document.querySelector(".content__tasks");
        if (!container) return;

        const isMobile = window.matchMedia("(max-width: 640px)").matches;

        if (isMobile) {
            window.addEventListener("scroll", () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight;
                const clientHeight = window.innerHeight;

                if (scrollTop + clientHeight >= scrollHeight - 50) {
                    FirebaseService.loadTasks(true);
                }
            });
        } else {
            container.addEventListener("scroll", () => {
                const { scrollTop, scrollHeight, clientHeight } = container;
                if (scrollTop + clientHeight >= scrollHeight - 50) {
                    FirebaseService.loadTasks(true);
                }
            });
        }
    },
};
