import { TELEGRAM_CONFIG } from "../config/telegram.js";

export const TelegramService = {
    sendNotification(task) {
        const text = `
<b>${task.title}</b>

${task.description}

<b>От:</b> ${task.createdBy}
${task.tzLink ? `<b>ТЗ:</b> <a href="${task.tzLink}">Смотреть ТЗ</a>` : ""}
${task.figmaLink ? `<b>Figma:</b> <a href="${task.figmaLink}">Смотреть макет</a>` : ""}
${task.deadLine ? `<b>Дедлайн:</b> ${task.deadLine}` : ""}
<b>Создано: </b>${new Date(task.createdAt).toLocaleString("ru-RU")}
    `.trim();

        fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CONFIG.chatId,
                text,
                parse_mode: "HTML",
            }),
        }).catch((err) => console.error("Telegram notification error:", err));
    },
};
