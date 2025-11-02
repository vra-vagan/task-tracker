import { CONSTANTS } from "../config/constants.js";
import { Utils } from "../utils/utils.js";

export const UI = {
    renderLoginForm() {
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
        return container;
    },

    renderTasks(tasks) {
        const container = document.querySelector(".content__tasks");
        if (!container) return;

        container.innerHTML = "";
        const today = new Date().toISOString().split("T")[0];

        if (tasks.length === 0) {
            container.innerHTML = `
        <div class="task__empty">
          <h2 class="task__text-title">Пока нет задач</h2>
        </div>
      `;
            return;
        }

        tasks.forEach((task) => {
            const taskDate = task.createdAt.split("T")[0];
            const isToday = taskDate === today;
            const dateLabel = isToday ? "Сегодня" : new Date(taskDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

            const taskItem = this.createTaskElement(task, dateLabel);
            container.appendChild(taskItem);
        });
    },

    createTaskElement(task, dateLabel) {
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
          <p class="task__top-description">${Utils.escapeHTML(task.description)}</p>
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
            </p>
          `
                  : ""
          }
          ${
              task.tzLink
                  ? `
            <a href="${task.tzLink}" class="task__bottom-item task__link task__link-t" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="12" viewBox="0 0 15 12" fill="none">
                <path d="M13.5645 6.18169L10.9395 8.80669C9.62695 10.1426 7.4707 10.1426 6.1582 8.80669C4.98633 7.63481 4.82227 5.80669 5.7832 4.44731L5.80664 4.42388C6.06445 4.07231 6.5332 4.002 6.86133 4.23638C7.18945 4.47075 7.2832 4.9395 7.02539 5.29106L7.00195 5.3145C6.46289 6.0645 6.55664 7.09575 7.21289 7.752C7.93945 8.502 9.13477 8.502 9.88477 7.752L12.5098 5.127C13.2598 4.377 13.2598 3.18169 12.5098 2.45513C11.8535 1.79888 10.8223 1.70513 10.0723 2.24419L10.0488 2.26763C9.69727 2.52544 9.22852 2.43169 8.99414 2.10356C8.75977 1.77544 8.83008 1.30669 9.1582 1.04888L9.20508 1.02544C10.5645 0.0645015 12.3926 0.228564 13.5645 1.40044C14.9004 2.71294 14.9004 4.86919 13.5645 6.18169ZM1.40039 5.64263L4.02539 2.99419C5.36133 1.68169 7.49414 1.68169 8.83008 2.99419C10.002 4.16606 10.1426 6.01763 9.18164 7.377L9.1582 7.40044C8.92383 7.752 8.43164 7.82231 8.10352 7.58794C7.77539 7.35356 7.68164 6.88481 7.93945 6.53325L7.96289 6.50981C8.50195 5.73638 8.4082 4.72856 7.75195 4.07231C7.02539 3.32231 5.83008 3.32231 5.08008 4.07231L2.45508 6.69731C1.72852 7.42388 1.72852 8.61919 2.45508 9.36919C3.11133 10.0254 4.14258 10.1192 4.89258 9.58013L4.91602 9.55669C5.26758 9.29888 5.73633 9.39263 5.9707 9.72075C6.20508 10.0489 6.13477 10.5176 5.80664 10.7754L5.75977 10.7989C4.42383 11.7598 2.57227 11.5958 1.40039 10.4239C0.0644531 9.11138 0.0644531 6.95513 1.40039 5.64263Z" fill="white"/>
              </svg>
              <span>ТЗ</span>
            </a>
          `
                  : ""
          }
          ${
              task.figmaLink
                  ? `
            <a href="${task.figmaLink}" class="task__bottom-item task__link task__link-f" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="12" viewBox="0 0 15 12" fill="none">
                <path d="M13.5645 6.18169L10.9395 8.80669C9.62695 10.1426 7.4707 10.1426 6.1582 8.80669C4.98633 7.63481 4.82227 5.80669 5.7832 4.44731L5.80664 4.42388C6.06445 4.07231 6.5332 4.002 6.86133 4.23638C7.18945 4.47075 7.2832 4.9395 7.02539 5.29106L7.00195 5.3145C6.46289 6.0645 6.55664 7.09575 7.21289 7.752C7.93945 8.502 9.13477 8.502 9.88477 7.752L12.5098 5.127C13.2598 4.377 13.2598 3.18169 12.5098 2.45513C11.8535 1.79888 10.8223 1.70513 10.0723 2.24419L10.0488 2.26763C9.69727 2.52544 9.22852 2.43169 8.99414 2.10356C8.75977 1.77544 8.83008 1.30669 9.1582 1.04888L9.20508 1.02544C10.5645 0.0645015 12.3926 0.228564 13.5645 1.40044C14.9004 2.71294 14.9004 4.86919 13.5645 6.18169ZM1.40039 5.64263L4.02539 2.99419C5.36133 1.68169 7.49414 1.68169 8.83008 2.99419C10.002 4.16606 10.1426 6.01763 9.18164 7.377L9.1582 7.40044C8.92383 7.752 8.43164 7.82231 8.10352 7.58794C7.77539 7.35356 7.68164 6.88481 7.93945 6.53325L7.96289 6.50981C8.50195 5.73638 8.4082 4.72856 7.75195 4.07231C7.02539 3.32231 5.83008 3.32231 5.08008 4.07231L2.45508 6.69731C1.72852 7.42388 1.72852 8.61919 2.45508 9.36919C3.11133 10.0254 4.14258 10.1192 4.89258 9.58013L4.91602 9.55669C5.26758 9.29888 5.73633 9.39263 5.9707 9.72075C6.20508 10.0489 6.13477 10.5176 5.80664 10.7754L5.75977 10.7989C4.42383 11.7598 2.57227 11.5958 1.40039 10.4239C0.0644531 9.11138 0.0644531 6.95513 1.40039 5.64263Z" fill="white"/>
              </svg>
              <span>Макет</span>
            </a>
          `
                  : ""
          }
        </div>
      </div>
      <div class="task__status" data-status="${task.status}">${CONSTANTS.STATUS_MAP[task.status]}</div>
    `;
        return taskItem;
    },

    createTaskModal(task) {
        const content = document.createElement("div");
        content.className = "task__full";
        content.dataset.id = task.id;

        const descrWithLinks = Utils.convertLinksToAnchors(task.description || "");
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
                ? `
          <button class="task__accept ${task.status === "created" ? "btn" : "btn btn__green"}">
            ${task.status === "created" ? "Начать задачу" : "Завершить задачу"}
          </button>
        `
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
    },

    createTaskForm(values = {}, isEdit = false) {
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
    },
};
