import { state } from "./state/state.js";
import { Auth } from "./services/auth-service.js";
import { FirebaseService } from "./services/firebase-service.js";
import { UI } from "./ui/ui.js";
import { EventHandlers } from "./handlers/event-handlers.js";
import { DeadlineTimer } from "./utils/deadline-timer.js";
import { HoverEffects } from "./utils/hover-effects.js";

export const App = {
    init() {
        if (state.appInitialized) return;
        state.appInitialized = true;

        EventHandlers.attachHeaderButtons();
        EventHandlers.initInfiniteScroll();
        FirebaseService.loadTasks();
    },

    setupEventListeners() {
        document.addEventListener("tasksLoaded", (e) => {
            UI.renderTasks(e.detail);
            EventHandlers.attachTaskClickHandlers();
            DeadlineTimer.start();
        });

        document.addEventListener("userLoggedIn", () => {
            this.init();
        });
    },

    bootstrap() {
        this.setupEventListeners();

        if (Auth.checkAuth()) {
            this.init();
        } else {
            const loginForm = UI.renderLoginForm();
            EventHandlers.attachLoginHandlers(loginForm);
        }

        HoverEffects.init();
    },
};
