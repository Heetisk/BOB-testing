export default function DataTable({ columns, data, emptyIcon: EmptyIcon, emptyMessage = 'No records found', className = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {EmptyIcon && <EmptyIcon size={40} className="text-text-3/30 mb-3" />}
        <p className="text-sm text-text-3">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-3/50">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-text-3/70 bg-surface-0/50"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              className="border-b border-surface-3/30 hover:bg-surface-2/30 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-4 py-3 text-sm text-text-2" style={col.width ? { width: col.width } : undefined}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
