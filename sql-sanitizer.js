export function isSafeSelect(sql) {
  if (!sql || typeof sql !== "string") return false;
  const lowered = sql.trim().toLowerCase();

  // must start with SELECT
  if (!/^select\b/.test(lowered)) return false;

  // disallow dangerous keywords
  const banned = ["insert ", "update ", "delete ", "drop ", "alter ", "truncate ", "create "];
  for (const b of banned) {
    if (lowered.includes(b)) return false;
   
  }

  // simple length guard
  if (sql.length > 10000) return false;

  return true;
}
