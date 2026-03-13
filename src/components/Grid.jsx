import React from 'react'
import Node from './Node'

export default function Grid({ grid, onToggleWall }) {
  return (
    <div className="grid">
      {grid.map((row, rIdx) => (
        <div className="grid-row" key={rIdx}>
          {row.map(node => (
            <Node key={`${node.row}-${node.col}`} node={node} onToggleWall={onToggleWall} />
          ))}
        </div>
      ))}
    </div>
  )
}
