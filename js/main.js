import { checkUserAuth } from "./auth.js";
import { handleHoverEffect } from "./effects.js";

export const taskContainer = document.querySelector(".content__tasks");

document.addEventListener("DOMContentLoaded", () => {
    checkUserAuth();
    handleHoverEffect();
});
