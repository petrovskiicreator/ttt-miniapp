export function getTelegramUserId(): string {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user?.id) {
    return String(tg.initDataUnsafe.user.id);
  }

  // fallback для тестов в браузере
  const local = localStorage.getItem("dev_user_id");
  if (local) return local;

  const fake = "dev_" + Math.random().toString(36).slice(2, 10);
  localStorage.setItem("dev_user_id", fake);
  return fake;
}
