import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, limit, query, orderBy, startAfter, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../config/firebase.js";
import { state } from "../state/state.js";
import { CONSTANTS } from "../config/constants.js";

export const FirebaseService = {
    async loadTasks(isNextPage = false) {
        if (state.isLoading || (!state.hasMore && isNextPage)) return;

        state.isLoading = true;
        const taskContainer = document.querySelector(".content__tasks");
        taskContainer?.classList.add("loading");

        try {
            let q;
            const tasksRef = collection(db, "tasks");

            if (state.currentUser?.role === "admin") {
                q = !isNextPage
                    ? query(tasksRef, orderBy("createdAt", "desc"), limit(CONSTANTS.TASKS_PER_PAGE))
                    : query(tasksRef, orderBy("createdAt", "desc"), startAfter(state.lastVisible), limit(CONSTANTS.TASKS_PER_PAGE));
            } else {
                const companyFilter = state.currentUser?.login || "";
                q = !isNextPage
                    ? query(tasksRef, where("company", "==", companyFilter), orderBy("createdAt", "desc"), limit(CONSTANTS.TASKS_PER_PAGE))
                    : query(tasksRef, where("company", "==", companyFilter), orderBy("createdAt", "desc"), startAfter(state.lastVisible), limit(CONSTANTS.TASKS_PER_PAGE));
            }

            const snapshot = await getDocs(q);
            const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            if (snapshot.docs.length > 0) {
                state.lastVisible = snapshot.docs[snapshot.docs.length - 1];
                state.allTasks = !isNextPage ? tasks : [...state.allTasks, ...tasks];

                const event = new CustomEvent("tasksLoaded", { detail: state.allTasks });
                document.dispatchEvent(event);
            } else {
                state.hasMore = false;
            }
        } finally {
            taskContainer?.classList.remove("loading");
            state.isLoading = false;
        }
    },

    async createTask(taskData) {
        const tasksRef = collection(db, "tasks");
        await addDoc(tasksRef, taskData);
    },

    async updateTask(id, updates) {
        const taskRef = doc(db, "tasks", id);
        await updateDoc(taskRef, updates);
    },

    async deleteTask(id) {
        const taskRef = doc(db, "tasks", id);
        await deleteDoc(taskRef);
    },
};
