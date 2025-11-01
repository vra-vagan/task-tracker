export const SELECTORS = {
    contentHeaderUpdate: ".content__header-update",
    contentHeaderLogout: ".content__header-logout",
    contentHeaderAdd: ".content__header-add",
    contentHeaderTitle: ".content__header-title",
    contentTasks: ".content__tasks",
    pageContainer: ".page__container",
    login: ".login",
    loginForm: ".login__form",
    loginInput: "#login",
    passwordInput: "#password",
    loginError: ".login__error",
    loginSubmit: ".login__submit",
    task: ".task",
    taskLink: ".task__link",
    addTaskTitle: "#add-task__title",
    addTaskDescription: "#add-task__description",
    addTaskCreatedBy: "#add-task__createdBy",
    addTaskDeadline: "#add-task__deadline",
    addTaskTzLink: "#add-task__tzLink",
    addTaskFigmaLink: "#add-task__figmaLink",
    taskFormCancel: ".task__form-cancel",
    taskFormInput: ".task__form-input",
    taskFormGroupDeadline: ".task__form-group-deadline",
    taskFormDatepicker: ".task__form-datepicker",
    modalContainer: ".modal__container",
    modalContent: ".modal__content",
    modalTitle: ".modal__title",
    modalHeader: ".modal__header",
    modal: ".modal",
    btnCopy: ".btn__copy",
    taskAccept: ".task__accept",
    taskEdit: ".task__edit",
    taskDelete: ".task__delete",
    btnShowMore: ".btn__show-more",
    taskFullAdditional: ".task__full-additional",
    taskFullAdditionalContent: ".task__full-additional-content",
    datepicker: ".datepicker",
    taskDeadline: ".task__deadline",
    clipboard: ".clipboard",
    taskEmpty: ".task__empty",
};

export const STATUS_MAP = {
    all: "Все задачи",
    done: "Выполнено",
    in_progress: "В процессе",
    created: "Не начато",
};

export const STATUS_TRANSITIONS = {
    created: "in_progress",
    in_progress: "done",
};

export const MONTH_NAMES = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export const MESSAGES = {
    enterLoginPassword: "Введите логин и пароль",
    userNotFound: "Пользователь не найден",
    wrongPassword: "Неверный пароль",
    linkCopied: "Ссылка скопирована",
    noTasks: "Пока нет задач",
    addTask: "Добавить задачу",
    editTask: "Изменить задачу",
    allTasks: "Все задачи",
};

export const CONFIG = {
    LIMIT_TASKS: 10,
    MOBILE_BREAKPOINT: 640,
    SCROLL_THRESHOLD: 50,
    TRANSITION_DELAY: 300,
    CLIPBOARD_DURATION: 4000,
    DEADLINE_CHECK_INTERVAL: 60000,
    INITIAL_TRANSITION_TIMEOUT: 10,
    HOVER_TRANSITION_TIMEOUT: 400,
};

export const DATE_FORMATS = {
    EN: "YYYY-MM-DD",
    RU: "DD.MM.YYYY",
};

export const TASK_STATUS = {
    CREATED: "created",
    IN_PROGRESS: "in_progress",
    DONE: "done",
};

