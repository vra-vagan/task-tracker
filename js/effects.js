import { SELECTORS } from "./constants.js";

const handleHoverEffect = () => {
    const targets = [
        ".content__header-btns-group",
        ".modal__close",
        ".btn__show-more",
        ".task__form-submit",
        ".task__form-cancel",
        ".login__submit",
        ".content__header-add",
        ".task__full-additional-content",
        ".task__accept",
    ];
    const movePower = 24;
    const scalePowerX = 0.05;
    const scalePowerY = 0.05;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const handleStart = (e) => {
        const el = e.target.closest(targets.join(","));
        if (!el) return;

        const r = el.getBoundingClientRect();
        el.dataset.initialWidth = r.width;
        el.dataset.initialHeight = r.height;
        const elementArea = r.width * r.height;
        const normArea = 5000;
        const baseBoost = Math.min(0.12, Math.max(0.03, (normArea / elementArea) * 0.06));

        el.dataset.baseBoost = baseBoost;
        el.style.transform = `scale(${1 + baseBoost})`;

        if (isTouch) {
            el._transitionTimeout = setTimeout(() => {
                el.style.transition = "none";
            }, 10);
        } else {
            el._transitionTimeout = setTimeout(() => {
                el.style.transition = "none";
            }, 400);
        }
    };

    const handleMove = (e) => {
        const el = e.target.closest(targets.join(","));
        if (!el) return;

        const point = e.touches?.[0] || e;
        if (!point) return;

        if (isTouch) e.preventDefault();

        const r = el.getBoundingClientRect();
        const w = parseFloat(el.dataset.initialWidth);
        const h = parseFloat(el.dataset.initialHeight);

        const ix = (point.clientX - r.left) / w - 0.5;
        const iy = (point.clientY - r.top) / h - 0.5;
        const tx = (ix * w) / movePower;
        const ty = (iy * h) / movePower;

        const baseBoost = parseFloat(el.dataset.baseBoost) || 0;
        const ax = Math.abs(ix) ** 0.7;
        const ay = Math.abs(iy) ** 0.7;
        const sx = 1 + baseBoost + ax * scalePowerX - ay * scalePowerY;
        const sy = 1 + baseBoost + ay * scalePowerY - ax * scalePowerX;

        el.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    };

    const handleEnd = (e) => {
        const el = e.target.closest(targets.join(","));
        if (!el) return;

        clearTimeout(el._transitionTimeout);
        el.style.transition = "";
        el.style.transform = "";
        delete el.dataset.baseBoost;
    };

    if (isTouch) {
        document.addEventListener("touchstart", handleStart, { passive: false });
        document.addEventListener("touchmove", handleMove, { passive: false });
        document.addEventListener("touchend", handleEnd, { passive: false });
    } else {
        document.addEventListener("mouseover", (e) => {
            const el = e.target.closest(targets.join(","));
            if (!el || el.contains(e.relatedTarget)) return;
            handleStart(e);
        });
        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseout", (e) => {
            const el = e.target.closest(targets.join(","));
            if (!el || el.contains(e.relatedTarget)) return;
            handleEnd(e);
        });
    }
};

const handleModalBgEvents = (modalContainer, modalBg) => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const handleModalMove = (e) => {
        const point = e.touches?.[0] || e;
        if (!point) return;
        if (e.target.closest(SELECTORS.taskFullAdditionalContent) || e.target.closest(SELECTORS.datepicker)) {
            modalBg.style.opacity = "";
            return;
        }
        modalBg.style.opacity = "1";
        const rect = modalContainer.getBoundingClientRect();
        const bgRect = modalBg.getBoundingClientRect();
        const x = point.clientX - rect.left - bgRect.width / 2;
        const y = point.clientY - rect.top - bgRect.height / 2;
        modalBg.style.transform = `translate(${x}px, ${y}px)`;
    };

    if (isTouch) {
        modalContainer.addEventListener("touchstart", () => (modalBg.style.opacity = "1"), { passive: false });
        modalContainer.addEventListener("touchmove", handleModalMove, { passive: false });
        modalContainer.addEventListener("touchend", () => (modalBg.style.opacity = ""));
    } else {
        modalContainer.addEventListener("mouseenter", () => (modalBg.style.opacity = "1"));
        modalContainer.addEventListener("mousemove", handleModalMove);
        modalContainer.addEventListener("mouseleave", () => (modalBg.style.opacity = ""));
    }
};

export { handleHoverEffect, handleModalBgEvents };