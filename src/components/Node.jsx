import React from 'react'

export default function Node({ node, onToggleWall }) {
  const { row, col, isStart, isEnd, isWall, isVisited, isPath } = node
  const classNames = ['node']
  if (isStart) classNames.push('node-start')
  if (isEnd) classNames.push('node-end')
  if (isWall) classNames.push('node-wall')
  if (isVisited) classNames.push('node-visited')
  if (isPath) classNames.push('node-path')

  return (
    <div
      className={classNames.join(' ')}
      onMouseDown={() => onToggleWall(row, col)}
      onTouchStart={() => onToggleWall(row, col)}
      title={`(${row}, ${col})`}
    />
  )
}
