import React from 'react';

/**
 * Simple Table component.
 * @param {{columns: Array<{key:string,label:string}>, rows: Array<Record<string, any>>}} props
 */
export default function Table({ columns, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => (<th key={col.key}>{col.label}</th>))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ color: 'var(--muted)' }}>No data</td></tr>
          ) : rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (<td key={col.key}>{renderCell(row[col.key])}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
