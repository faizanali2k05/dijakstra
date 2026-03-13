import React from 'react'

export default function Controls({ onVisualize, onClear, onClearVisited, onRandomWalls, running }) {
  return (
    <div className="controls">
      <button onClick={onVisualize} disabled={running}>Visualize Dijkstra</button>
      <button onClick={onClear} disabled={running}>Clear All</button>
      <button onClick={onClearVisited} disabled={running}>Clear Visited</button>
      <button onClick={onRandomWalls} disabled={running}>Random Walls</button>
      <div className="hint">Click cells to toggle walls. Start and end are fixed.</div>
    </div>
  )
}
