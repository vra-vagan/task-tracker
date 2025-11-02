import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../config/firebase.js";
import { state } from "../state/state.js";

export const Auth = {
    getUser() {
        const userData = localStorage.getItem("user");
        return userData ? JSON.parse(userData) : null;
    },

    setUser(user) {
        localStorage.setItem("user", JSON.stringify(user));
        state.currentUser = user;
    },

    logout() {
        localStorage.removeItem("user");
        location.reload();
    },

    async login(login, password) {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const user = users.find((u) => u.login === login);

        if (!user) throw new Error("Пользователь не найден");
        if (user.password !== password) throw new Error("Неверный пароль");

        return { login: user.login, role: user.role };
    },

    checkAuth() {
        const user = this.getUser();
        const pageContainer = document.querySelector(".page__container");

        if (!user) {
            pageContainer?.classList.add("hidden");
            return false;
        }

        pageContainer?.classList.remove("hidden");
        state.currentUser = user;
        return true;
    },
};
