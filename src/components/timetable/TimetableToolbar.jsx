
import React from 'react';

export default function TimetableToolbar({ onSelectSection }) {
  return (
    <div className="toolbar-card">
      <label htmlFor="cohort-select">Cohort: </label>

      <select
        id="cohort-select"
        onChange={(event) => onSelectSection?.(event.target.value)}
        defaultValue="Sem 5 Div A"
      >
        <option value="Sem 5 Div A">Sem 5 Div A</option>
        <option value="Sem 5 Div B">Sem 5 Div B</option>
        <option value="Sem 6 Div A">Sem 6 Div A</option>
        <option value="Sem 6 Div B">Sem 6 Div B</option>
      </select>
    </div>
  );
}
