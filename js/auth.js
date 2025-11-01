import { setCurrentUser } from "./store.js";
import { initApp } from "./app.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";
import { SELECTORS, MESSAGES } from "./constants.js";
import { setButtonLoading } from "./utils.js";

const checkUserAuth = () => {
    const userData = localStorage.getItem("user");
    const pageContainer = document.querySelector(SELECTORS.pageContainer);

    if (!userData) {
        pageContainer?.classList.add("hidden");
        renderLoginForm();
    } else {
        pageContainer?.classList.remove("hidden");
        setCurrentUser(JSON.parse(userData));
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
    const loginInput = e.target.querySelector(SELECTORS.loginInput);
    const passwordInput = e.target.querySelector(SELECTORS.passwordInput);
    const errorEl = e.target.querySelector(SELECTORS.loginError);

    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();

    if (!login || !password) {
        errorEl.textContent = MESSAGES.enterLoginPassword;
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const user = users.find((u) => u.login === login);

        if (!user) {
            errorEl.textContent = MESSAGES.userNotFound;
            setButtonLoading(submitBtn, false);
            return;
        }

        if (user.password !== password) {
            errorEl.textContent = MESSAGES.wrongPassword;
            setButtonLoading(submitBtn, false);
            return;
        }

        localStorage.setItem("user", JSON.stringify({ login: user.login, role: user.role }));
        setCurrentUser(user);
        initApp();
        document.querySelector(SELECTORS.login)?.remove();
        document.querySelector(SELECTORS.pageContainer)?.classList.remove("hidden");
    } catch (error) {
        setButtonLoading(submitBtn, false);
        errorEl.textContent = "Произошла ошибка";
    }
};

const logoutUser = () => {
    localStorage.removeItem("user");
    location.reload();
};

export { checkUserAuth, renderLoginForm, handleLogin, logoutUser };
