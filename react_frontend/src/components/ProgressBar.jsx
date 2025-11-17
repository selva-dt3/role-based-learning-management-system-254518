import React from 'react';

/**
 * ProgressBar shows a visual progress indicator.
 * @param {{value:number}} props
 */
export default function ProgressBar({ value = 0 }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}>
      <div className="progress-fill" style={{ width: `${safe}%` }} />
    </div>
  );
}
