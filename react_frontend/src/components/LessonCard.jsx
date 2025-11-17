import React from 'react';
import ProgressBar from './ProgressBar';

/**
 * LessonCard renders a lesson summary with progress and actions.
 * @param {{title:string, description?:string, files?:number, progress?:number, onOpen?:()=>void}} props
 */
export default function LessonCard({ title, description, files = 0, progress = 0, onOpen }) {
  return (
    <article className="card lesson-card">
      <h4 className="card-title">{title}</h4>
      {description && <p className="card-desc">{description}</p>}
      <ProgressBar value={progress} />
      <div className="meta" aria-label="Lesson metadata">
        <span>{files} files</span>
        <button className="btn btn-secondary" onClick={onOpen}>Open</button>
      </div>
    </article>
  );
}
