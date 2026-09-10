/**
 * Требования к паролю и оценка надёжности.
 *
 * Минимум — 8 символов. Отдельно отсекаются самые частые пароли: длина
 * ничего не значит, если пароль стоит в первой сотне любого словаря для
 * перебора.
 */

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Сотня паролей, которые чаще всего встречаются в утечках, плюс варианты,
 * характерные для русскоязычных пользователей (слова, набранные в
 * латинской раскладке, и клавиатурные последовательности).
 */
const COMMON_PASSWORDS = new Set([
  "123456", "123456789", "12345678", "password", "qwerty", "12345", "qwerty123", "1q2w3e",
  "111111", "1234567890", "1234567", "000000", "abc123", "iloveyou", "password1", "qwertyuiop",
  "123123", "monkey", "dragon", "sunshine", "princess", "football", "123321", "666666",
  "654321", "7777777", "123qwe", "zxcvbnm", "qazwsx", "trustno1", "letmein", "welcome",
  "admin", "administrator", "root", "user", "guest", "test", "login", "passw0rd",
  "password123", "admin123", "qwerty1", "1qaz2wsx", "asdfgh", "asdfghjkl", "master", "shadow",
  "superman", "batman", "michael", "jennifer", "jordan", "harley", "ranger", "hunter",
  "buster", "soccer", "hockey", "killer", "george", "sexy", "andrew", "charlie",
  "thomas", "robert", "access", "love", "money", "freedom", "whatever", "starwars",
  // Русскоязычные частые варианты
  "parol", "parol123", "privet", "privet123", "ghbdtn", "yfnfif", "rjhjkm", "gfhjkm",
  "lyubov", "natasha", "sergey", "andrey", "aleksey", "marina", "russia", "moscow",
  "spartak", "zenit", "dinamo", "stroyka", "stroitel", "master123", "rabota", "stroy",
  "12341234", "11111111", "qwerty12", "qwe123", "asd123", "zxc123", "1234qwer", "q1w2e3r4",
]);

export type PasswordStrength = {
  /** 0 — недопустим, 1 — слабый, 2 — средний, 3 — надёжный. */
  score: 0 | 1 | 2 | 3;
  label: string;
  /** Что мешает, если пароль не принимается. */
  problem: string | null;
};

export function checkPassword(password: string): PasswordStrength {
  const value = password.trim();

  if (value.length === 0) {
    return { score: 0, label: "", problem: null };
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return {
      score: 0,
      label: "Слишком короткий",
      problem: `Минимум ${MIN_PASSWORD_LENGTH} символов`,
    };
  }

  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    return {
      score: 0,
      label: "Слишком простой",
      problem: "Такой пароль есть в списках для перебора — придумайте другой",
    };
  }

  // Считаем разнообразие: строчные, прописные, цифры, прочие символы.
  let variety = 0;
  if (/[a-zа-яё]/.test(value)) variety++;
  if (/[A-ZА-ЯЁ]/.test(value)) variety++;
  if (/\d/.test(value)) variety++;
  if (/[^a-zA-Zа-яА-ЯёЁ\d]/.test(value)) variety++;

  // Однообразные и последовательные строки длину «не отрабатывают».
  const repeated = /^(.)\1+$/.test(value);
  const sequential = /(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv)/i.test(value);

  if (repeated || (variety <= 1 && value.length < 12) || sequential) {
    return { score: 1, label: "Слабый", problem: null };
  }

  if (variety >= 3 && value.length >= 12) {
    return { score: 3, label: "Надёжный", problem: null };
  }

  if (variety >= 2 || value.length >= 12) {
    return { score: 2, label: "Средний", problem: null };
  }

  return { score: 1, label: "Слабый", problem: null };
}

/** Пароль допустим к сохранению. */
export function isPasswordAcceptable(password: string): boolean {
  return checkPassword(password).score > 0;
}
