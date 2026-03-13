import React from 'react'

export default function About() {
  return (
    <div className="page page-about">
      <h2>What is Dijkstra's Algorithm?</h2>
      <p>
        Dijkstra's algorithm finds the shortest path from a start node to all other
        nodes in a weighted graph with non-negative edge weights. It's commonly
        used in routing, maps, and network routing.
      </p>

      <h3>How it works (high level)</h3>
      <ol>
        <li>Assign every node a tentative distance (start = 0, others = ∞).</li>
        <li>Set the start node as current. Visit the unvisited neighbor with the
            smallest tentative distance and update their distances.</li>
        <li>Mark nodes as visited once their shortest distance is known.</li>
        <li>Repeat until all nodes are visited or the target is reached.</li>
      </ol>

      <h3>Complexity</h3>
      <p>
        Using a simple array for the unvisited set, Dijkstra runs in O(V^2). With a
        binary heap (priority queue) it runs in O((V + E) log V) where V is the
        number of vertices and E is the number of edges.
      </p>

      <h3>Notes for this visualizer</h3>
      <ul>
        <li>Grid edges are unweighted (cost = 1) in this demo.</li>
        <li>Walls block traversal.</li>
        <li>Start and end are fixed; future enhancements include draggable start/end and weights.</li>
      </ul>
    </div>
  )
}
