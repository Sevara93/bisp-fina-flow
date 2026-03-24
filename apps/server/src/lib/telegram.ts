import { env } from "@bisp-final-flow/env/server";

const TELEGRAM_API = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

// Отправить сообщение в Telegram
export async function sendTelegramMessage(
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Уведомить провайдера — сначала Telegram, потом email fallback
export async function notifyProvider(
  telegramChatId: string | null,
  telegramUsername: string | null,
  message: string
): Promise<void> {
  // Приоритет: chatId → username → ничего
  const chatId = telegramChatId ?? telegramUsername;

  if (chatId) {
    const sent = await sendTelegramMessage(chatId, message);
    if (sent) return;
  }

  // TODO: email fallback (Неделя 4)
  console.log("Telegram недоступен, нужен email fallback");
}
