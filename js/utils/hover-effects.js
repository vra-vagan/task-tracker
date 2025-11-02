import { CONSTANTS } from "../config/constants.js";

export const HoverEffects = {
    init() {
        const movePower = 18;
        const scalePowerX = 0.08;
        const scalePowerY = 0.08;
        const isTouch = window.matchMedia("(pointer: coarse)").matches;
        const targets = CONSTANTS.HOVER_TARGETS.join(",");

        const handleStart = (e) => {
            const el = e.target.closest(targets);
            if (!el) return;

            const r = el.getBoundingClientRect();
            el.dataset.initialWidth = r.width;
            el.dataset.initialHeight = r.height;

            const elementArea = r.width * r.height;
            const normArea = 5000;
            const baseBoost = Math.min(0.12, Math.max(0.03, (normArea / elementArea) * 0.06));

            el.dataset.baseBoost = baseBoost;
            el.style.transform = `scale(${1 + baseBoost})`;

            el._transitionTimeout = setTimeout(
                () => {
                    el.style.transition = "none";
                },
                isTouch ? 10 : 400
            );
        };

        const handleMove = (e) => {
            const el = e.target.closest(targets);
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
            const el = e.target.closest(targets);
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
                const el = e.target.closest(targets);
                if (!el || el.contains(e.relatedTarget)) return;
                handleStart(e);
            });
            document.addEventListener("mousemove", handleMove);
            document.addEventListener("mouseout", (e) => {
                const el = e.target.closest(targets);
                if (!el || el.contains(e.relatedTarget)) return;
                handleEnd(e);
            });
        }
    },
};
