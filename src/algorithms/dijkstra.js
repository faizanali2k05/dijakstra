export function dijkstra(grid) {
  const startNode = findNode(grid, n => n.isStart)
  const endNode = findNode(grid, n => n.isEnd)
  if (!startNode || !endNode) return { visitedNodesInOrder: [], shortestPath: [] }

  const visitedNodesInOrder = []
  startNode.distance = 0

  const unvisited = []
  for (const row of grid) for (const n of row) unvisited.push(n)

  while (unvisited.length) {
    unvisited.sort((a, b) => a.distance - b.distance)
    const closest = unvisited.shift()
    if (closest.isWall) continue
    if (closest.distance === Infinity) break
    closest.isVisited = true
    visitedNodesInOrder.push(closest)
    if (closest === endNode) break

    const neighbors = getNeighbors(grid, closest)
    for (const nb of neighbors) {
      const alt = closest.distance + 1
      if (alt < nb.distance) {
        nb.distance = alt
        nb.previousNode = closest
      }
    }
  }

  const shortestPath = []
  let cur = endNode
  while (cur) {
    shortestPath.unshift(cur)
    cur = cur.previousNode
  }
  if (shortestPath[0] !== startNode) return { visitedNodesInOrder, shortestPath: [] }

  return { visitedNodesInOrder, shortestPath }
}

function findNode(grid, predicate) {
  for (const row of grid) for (const n of row) if (predicate(n)) return n
  return null
}

function getNeighbors(grid, node) {
  const { row, col } = node
  const neighbors = []
  if (row > 0) neighbors.push(grid[row - 1][col])
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col])
  if (col > 0) neighbors.push(grid[row][col - 1])
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1])
  return neighbors.filter(n => !n.isVisited)
}
