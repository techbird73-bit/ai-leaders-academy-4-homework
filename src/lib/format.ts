export const won = (n: number) => n.toLocaleString("ko-KR");

const pad = (n: number) => String(n).padStart(2, "0");

/** Date → "YYYY-MM-DD" (로컬 기준) */
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Date → datetime-local input 값 */
export const toLocalInput = (d: Date) => `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const timeLabel = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const monthLabel = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
