export const Utils = {
    capitalizeFirstLetter(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    escapeHTML(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    },

    convertLinksToAnchors(text) {
        const safeText = this.escapeHTML(text);
        if (/[<>]/.test(text)) return safeText;

        return safeText.replace(/((https?:\/\/|www\.)[^\s<>()\]]+[^\s<>,.?!:;()\]])/gi, (match) => {
            let url = match;
            if (!/^https?:\/\//i.test(url)) {
                url = "https://" + url;
            }
            return `<span class="task__full-description-link">
        <a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>
        <button class="btn__copy" data-url="${url}">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.5 2H13.375C13.75 2 14.1562 2.1875 14.4375 2.46875L16.5312 4.5625C16.8125 4.84375 17 5.25 17 5.625V12.5C17 13.3438 16.3125 14 15.5 14H9.5C8.65625 14 8 13.3438 8 12.5V3.5C8 2.6875 8.65625 2 9.5 2ZM4.5 6H7V8H5V16H11V15H13V16.5C13 17.3438 12.3125 18 11.5 18H4.5C3.65625 18 3 17.3438 3 16.5V7.5C3 6.6875 3.65625 6 4.5 6Z" fill="#0078FF"></path>
          </svg>
        </button>
      </span>`;
        });
    },

    copyToClipboard(url) {
        if (!url) return;
        navigator.clipboard.writeText(url);

        let clipboardContainer = document.querySelector(".clipboard");
        if (!clipboardContainer) {
            clipboardContainer = document.createElement("div");
            clipboardContainer.className = "clipboard";
            document.body.appendChild(clipboardContainer);
        }

        const clipboardItem = document.createElement("div");
        clipboardItem.className = "clipboard__item";
        clipboardItem.textContent = "Ссылка скопирована";
        clipboardContainer.appendChild(clipboardItem);

        setTimeout(() => {
            clipboardItem.style.opacity = "0";
            setTimeout(() => {
                clipboardItem.remove();
                if (clipboardContainer.children.length === 0) {
                    clipboardContainer.remove();
                }
            }, 300);
        }, 4000);
    },

    handleTitleWrap(el) {
        if (!el) return;

        const original = el.dataset.originalText || el.textContent.replace(/\s*\n\s*/g, " ").trim();
        el.dataset.originalText = original;
        el.textContent = original;

        const style = getComputedStyle(el);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const availableWidth = el.offsetWidth - (paddingLeft + paddingRight);

        const measure = document.createElement("span");
        measure.style.cssText = "visibility:hidden;white-space:nowrap;position:absolute;";
        measure.style.font = style.font;
        document.body.appendChild(measure);

        measure.textContent = original;
        if (measure.offsetWidth <= availableWidth) {
            el.textContent = original;
            document.body.removeChild(measure);
            return;
        }

        const words = original.split(" ");
        let firstLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const testLine = firstLine + " " + words[i];
            measure.textContent = testLine;
            if (measure.offsetWidth > availableWidth) break;
            firstLine = testLine;
        }

        const secondLine = original.slice(firstLine.length).trim();
        el.innerHTML = firstLine + "<br>" + secondLine;
        document.body.removeChild(measure);
    },
};
