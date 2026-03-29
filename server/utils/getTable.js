// Convert a Turso ResultSet into an array of plain objects
export function getTable(result) {
  return result.rows.map(row =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  );
}
