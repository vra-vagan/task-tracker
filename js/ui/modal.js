import { Utils } from "../utils/utils.js";

export const Modal = {
    open(content, title = "Добавить задачу") {
        const modal = document.createElement("div");
        modal.className = "modal";

        const modalContainer = document.createElement("div");
        modalContainer.className = "modal__container";

        const modalHeader = document.createElement("div");
        modalHeader.className = "modal__header";

        const modalTitle = document.createElement("h1");
        modalTitle.className = "modal__title";
        modalTitle.textContent = title;
        modalTitle.dataset.originalText = title;

        const modalClose = document.createElement("button");
        modalClose.className = "modal__close btn";
        modalClose.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.280428 15.7196C0.155794 15.5949 0.0727037 15.4469 0.0311587 15.2756C-0.0103862 15.1094 -0.0103862 14.9406 0.0311587 14.7692C0.0727037 14.6031 0.153197 14.4628 0.272639 14.3486L6.62123 8L0.272639 1.65141C0.153197 1.53716 0.0727037 1.39695 0.0311587 1.23077C-0.0103862 1.06459 -0.0103862 0.895813 0.0311587 0.72444C0.0727037 0.553067 0.155794 0.405063 0.280428 0.280428C0.405063 0.155794 0.550471 0.0727037 0.71665 0.0311587C0.888023 -0.0103862 1.0568 -0.0103862 1.22298 0.0311587C1.38916 0.0727037 1.53457 0.153197 1.6592 0.272639L8 6.62123L14.3408 0.280428C14.4654 0.155794 14.6108 0.0727037 14.777 0.0311587C14.9432 -0.0103862 15.1094 -0.0103862 15.2756 0.0311587C15.4417 0.0727037 15.5871 0.155794 15.7118 0.280428C15.8416 0.405063 15.9273 0.553067 15.9688 0.72444C16.0104 0.89062 16.0104 1.0568 15.9688 1.22298C15.9273 1.38916 15.8442 1.53457 15.7196 1.6592L9.37877 8L15.7196 14.3408C15.8442 14.4654 15.9247 14.6082 15.9611 14.7692C16.0026 14.9354 16.0026 15.1016 15.9611 15.2678C15.9247 15.4391 15.8416 15.5897 15.7118 15.7196C15.5871 15.8442 15.4417 15.9273 15.2756 15.9688C15.1094 16.0104 14.9432 16.0104 14.777 15.9688C14.6108 15.9273 14.4654 15.8442 14.3408 15.7196L8 9.37877L1.6592 15.7274C1.53457 15.8468 1.38916 15.9273 1.22298 15.9688C1.0568 16.0104 0.89062 16.0104 0.72444 15.9688C0.55826 15.9273 0.410256 15.8442 0.280428 15.7196Z" fill="white"/>
      </svg>
    `;

        const modalContent = document.createElement("div");
        modalContent.className = "modal__content";
        modalContent.appendChild(content);

        const modalBgWrapper = document.createElement("div");
        modalBgWrapper.className = "modal__bg-wrapper";
        const modalBg = document.createElement("div");
        modalBg.className = "modal__bg";
        modalBgWrapper.appendChild(modalBg);

        modalHeader.append(modalTitle, modalClose);
        modalContainer.append(modalHeader, modalContent, modalBgWrapper);
        modal.appendChild(modalContainer);
        document.body.appendChild(modal);

        setTimeout(() => (modal.dataset.active = "true"), 0);

        this.attachModalEffects(modal, modalContainer, modalBg, modalContent, modalTitle, modalHeader);
        modalClose.addEventListener("click", this.close);
        modal.addEventListener("click", (e) => {
            if (!e.target.closest(".modal__container")) {
                this.close(e);
            }
        });

        return modal;
    },

    close(e) {
        const target = e?.target || e?.currentTarget;
        const modal = target?.closest?.(".modal") || document.querySelector(".modal");
        if (!modal) return;

        modal.dataset.active = "false";
        setTimeout(() => {
            modal.remove();
            window.removeEventListener("resize", modal._handleResize);
        }, 300);
    },

    attachModalEffects(modal, modalContainer, modalBg, modalContent, modalTitle, modalHeader) {
        const handleMove = (e) => {
            const point = e.touches?.[0] || e;
            if (!point) return;

            if (e.target.closest(".task__full-additional-content") || e.target.closest(".datepicker")) {
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

        const handleResize = () => {
            modalContent.style.paddingTop = modalHeader.offsetHeight + "px";
            Utils.handleTitleWrap(modalTitle);
        };

        const isTouch = window.matchMedia("(pointer: coarse)").matches;
        if (isTouch) {
            modalContainer.addEventListener("touchstart", () => (modalBg.style.opacity = "1"), { passive: false });
            modalContainer.addEventListener("touchmove", handleMove, { passive: false });
            modalContainer.addEventListener("touchend", () => (modalBg.style.opacity = ""));
        } else {
            modalContainer.addEventListener("mouseenter", () => (modalBg.style.opacity = "1"));
            modalContainer.addEventListener("mousemove", handleMove);
            modalContainer.addEventListener("mouseleave", () => (modalBg.style.opacity = ""));
        }

        window.addEventListener("resize", handleResize);
        modal._handleResize = handleResize;
        handleResize();

        modalContainer.dataset.scroll = "false";
        modalContent.addEventListener("scroll", () => {
            modalContainer.dataset.scroll = modalContent.scrollTop > 0 ? "true" : "false";
        });
    },
};
