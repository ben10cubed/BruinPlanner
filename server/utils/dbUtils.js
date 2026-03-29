export async function runAndSave(db, sql, params = []) {
  await db.execute({ sql, args: params });
}

export async function execAndSave(db, sql) {
  await db.execute(sql);
}
