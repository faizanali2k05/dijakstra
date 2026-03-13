import React, { useState, useEffect } from 'react'
import Grid from './components/Grid'
import Controls from './components/Controls'
import { dijkstra } from './algorithms/dijkstra'
import About from './pages/About'
import AboutUs from './pages/AboutUs'
import Footer from './components/Footer'
import logo from './assets/logo.png'
import { Navbar, Container, Nav } from 'react-bootstrap'

export default function App() {
  const [rows] = useState(20)
  const [cols] = useState(50)
  const [grid, setGrid] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [page, setPage] = useState('home')

  useEffect(() => {
    const initialGrid = createGrid(rows, cols)
    setGrid(initialGrid)
  }, [rows, cols])

  function createGrid(rows, cols) {
    const g = []
    for (let r = 0; r < rows; r++) {
      const row = []
      for (let c = 0; c < cols; c++) {
        row.push(createNode(r, c))
      }
      g.push(row)
    }
    return g
  }

  function createNode(row, col) {
    const start = { row: Math.floor(rows / 2), col: 5 }
    const end = { row: Math.floor(rows / 2), col: cols - 6 }
    return {
      row,
      col,
      isStart: row === start.row && col === start.col,
      isEnd: row === end.row && col === end.col,
      isWall: false,
      isVisited: false,
      previousNode: null,
      distance: Infinity
    }
  }

  function toggleWall(row, col) {
    if (isRunning) return
    const newGrid = grid.map(r => r.map(n => ({ ...n })))
    const node = newGrid[row][col]
    if (node.isStart || node.isEnd) return
    node.isWall = !node.isWall
    setGrid(newGrid)
  }

  function clearGrid(keepWalls = false) {
    const newGrid = grid.map(row => row.map(node => ({
      ...node,
      isVisited: false,
      isPath: false,
      previousNode: null,
      distance: Infinity,
      isWall: keepWalls ? node.isWall : false
    })))
    setGrid(newGrid)
  }

  function randomWalls() {
    if (isRunning) return
    const newGrid = grid.map(row => row.map(node => ({ ...node })))
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = newGrid[r][c]
        if (n.isStart || n.isEnd) continue
        n.isWall = Math.random() < 0.25
      }
    }
    setGrid(newGrid)
  }

  async function visualizeDijkstra() {
    setIsRunning(true)
    clearGrid(true)
    const flatGrid = grid.map(row => row.map(n => ({ ...n })))
    const { visitedNodesInOrder, shortestPath } = dijkstra(flatGrid)

    for (let i = 0; i < visitedNodesInOrder.length; i++) {
      const node = visitedNodesInOrder[i]
      await new Promise(res => setTimeout(res, 8))
      setGrid(prev => {
        const ng = prev.map(r => r.map(n => ({ ...n })))
        ng[node.row][node.col].isVisited = true
        return ng
      })
    }

    for (let i = 0; i < shortestPath.length; i++) {
      const node = shortestPath[i]
      await new Promise(res => setTimeout(res, 40))
      setGrid(prev => {
        const ng = prev.map(r => r.map(n => ({ ...n })))
        ng[node.row][node.col].isPath = true
        return ng
      })
    }

    setIsRunning(false)
  }

  return (
    <div className="app">
      <Navbar bg="dark" variant="dark" expand="md" className="mb-3">
        <Container>
          <Navbar.Brand style={{cursor:'pointer'}} onClick={() => setPage('home')}>
            <img src={logo} alt="logo" className="logo" style={{width:36,height:36,marginRight:8}} />
            Dijkstra Visualizer
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Nav.Link onClick={() => setPage('home')}>Home</Nav.Link>
              <Nav.Link onClick={() => setPage('about')}>About</Nav.Link>
              <Nav.Link onClick={() => setPage('aboutus')}>About Us</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        {page === 'home' && (
          <main>
            <Controls
              onVisualize={visualizeDijkstra}
              onClear={() => clearGrid(false)}
              onClearVisited={() => clearGrid(true)}
              onRandomWalls={randomWalls}
              running={isRunning}
            />
            <div style={{overflowX:'auto'}}>
              <Grid grid={grid} onToggleWall={toggleWall} />
            </div>
          </main>
        )}

        {page === 'about' && <About />}
        {page === 'aboutus' && <AboutUs />}
      </Container>

      <Footer />
    </div>
  )
}
