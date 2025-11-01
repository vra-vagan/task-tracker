import { taskContainer } from "./main.js";
import { setAllTasks, setLastVisible, setHasMore, setAppInitialized, getAppInitialized, getAllTasks, setCurrentUser } from "./store.js";
import { loadTasks, initInfiniteScroll } from "./tasks.js";
import { createTaskContent, createTaskForm, insertModal, closeModal, handleTaskSubmit, attachModalActions } from "./modal.js";
import { handleDatepickerInput } from "./datepicker.js";
import { logoutUser, checkUserAuth } from "./auth.js";
import { SELECTORS, MESSAGES } from "./constants.js";

const handleBtns = () => {
    const updateBtn = document.querySelector(SELECTORS.contentHeaderUpdate);
    if (updateBtn) {
        updateBtn.addEventListener("click", () => {
            setAllTasks([]);
            setLastVisible(null);
            setHasMore(true);
            loadTasks(false);
        });
    }

    const logoutBtn = document.querySelector(SELECTORS.contentHeaderLogout);
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }
};

const handleTaskClick = () => {
    taskContainer.addEventListener("click", (e) => {
        const taskItem = e.target.closest(SELECTORS.task);
        if (!taskItem || e.target.closest(SELECTORS.taskLink)) return;

        const taskId = taskItem.dataset.id;
        const task = getAllTasks().find((t) => t.id === taskId);
        if (!task) return;

        const content = createTaskContent(task);
        const modal = insertModal(content, task.title || "");
        attachModalActions(modal, content, task);
    });
};

const handleAdd = () => {
    document.querySelector(SELECTORS.contentHeaderAdd)?.addEventListener("click", () => {
        const userData = localStorage.getItem("user");
        if (!userData) {
            checkUserAuth();
            return;
        }
        setCurrentUser(JSON.parse(userData));
        const addForm = createTaskForm();
        insertModal(addForm, MESSAGES.addTask);

        addForm.addEventListener("submit", (e) => handleTaskSubmit(e));
        addForm.querySelector(SELECTORS.taskFormCancel).addEventListener("click", closeModal);

        handleDatepickerInput(addForm);
        addForm.querySelectorAll(SELECTORS.taskFormInput).forEach((input) => {
            input.addEventListener("input", () => {
                if (input.classList.contains("error") && input.value.trim() !== "") {
                    input.classList.remove("error");
                }
            });
        });
    });
};

const initApp = () => {
    if (getAppInitialized()) return;
    setAppInitialized(true);

    handleBtns();
    handleAdd();
    handleTaskClick();
    loadTasks();
    initInfiniteScroll();
};

export { handleBtns, handleTaskClick, handleAdd, initApp };