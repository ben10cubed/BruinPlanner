export function runAndSave(db, sql, params = []) {
  db.run(sql, params);
  db.saveToDisk();
}

export function execAndSave(db, sql) {
  db.exec(sql);
  db.saveToDisk();
}
