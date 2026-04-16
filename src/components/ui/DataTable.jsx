import "./DataTable.css";
import Spinner from "./Spinner";

export default function DataTable({
  columns,
  rows,
  loading,
  empty = "No results",
  onRowClick,
  getRowKey = (r) => r.id,
}) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width }} className={c.align ? `align-${c.align}` : ""}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ui-table-state">
                <Spinner />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ui-table-state">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "is-clickable" : ""}
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.align ? `align-${c.align}` : ""}>
                    {c.cell ? c.cell(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div className="ui-pagination">
      <span>
        {total > 0
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`
          : "0 of 0"}
      </span>
      <div className="ui-pagination-buttons">
        <button disabled={!canPrev} onClick={() => onChange(page - 1)}>Prev</button>
        <span className="ui-pagination-page">Page {page} / {totalPages}</span>
        <button disabled={!canNext} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}
