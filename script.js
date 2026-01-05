class GraphVisualizer {
    constructor() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.isAddingEdge = false;
        this.animationSpeed = 200;
        this.isRunning = false;
        this.stepIndex = 0;
        this.algorithmSteps = [];
        
        // Initialize canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Event listeners
        this.setupEventListeners();
        
        // Draw initial state
        this.draw();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.draw();
    }

    setupEventListeners() {
        // Canvas click for adding nodes
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (document.getElementById('add-node').classList.contains('active')) {
                this.addNode(x, y);
            } else if (document.getElementById('add-edge').classList.contains('active')) {
                this.handleEdgeClick(x, y);
            }
        });

        // Control buttons
        document.getElementById('add-node').addEventListener('click', () => {
            this.toggleMode('add-node');
            this.updateStatus('Click on canvas to add nodes');
        });

        document.getElementById('add-edge').addEventListener('click', () => {
            this.toggleMode('add-edge');
            this.updateStatus('Click first node, then second node to create edge');
        });

        document.getElementById('clear').addEventListener('click', () => this.clearAll());
        document.getElementById('run').addEventListener('click', () => this.runDijkstra());
        document.getElementById('step').addEventListener('click', () => this.stepThrough());
        document.getElementById('reset').addEventListener('click', () => this.resetVisualization());

        // Speed control
        document.getElementById('speed').addEventListener('input', (e) => {
            this.animationSpeed = 300 - (e.target.value * 25);
            const speedText = ['Very Slow', 'Slow', 'Medium', 'Fast', 'Very Fast'][Math.floor(e.target.value / 2)];
            document.getElementById('speed-value').textContent = speedText;
        });
    }

    toggleMode(mode) {
        const buttons = ['add-node', 'add-edge'];
        buttons.forEach(btn => {
            const button = document.getElementById(btn);
            if (btn === mode) {
                button.classList.toggle('active');
                button.style.background = button.classList.contains('active') ? '#339af0' : '';
            } else {
                button.classList.remove('active');
                button.style.background = '';
            }
        });
    }

    addNode(x, y) {
        const id = String.fromCharCode(65 + this.nodes.length); // A, B, C, ...
        const node = { id, x, y, radius: 20 };
        this.nodes.push(node);
        
        // Update dropdowns
        this.updateNodeSelects();
        this.updateStatus(`Added node ${id} at (${Math.round(x)}, ${Math.round(y)})`);
        this.draw();
    }

    handleEdgeClick(x, y) {
        const clickedNode = this.findNodeAt(x, y);
        
        if (clickedNode) {
            if (!this.selectedNode) {
                this.selectedNode = clickedNode;
                this.updateStatus(`Selected node ${clickedNode.id}. Now click another node`);
            } else if (clickedNode !== this.selectedNode) {
                const weight = prompt(`Enter weight for edge ${this.selectedNode.id}-${clickedNode.id}:`, '1');
                if (weight && !isNaN(weight)) {
                    this.addEdge(this.selectedNode, clickedNode, parseInt(weight));
                }
                this.selectedNode = null;
            }
        }
    }

    addEdge(node1, node2, weight) {
        // Check if edge already exists
        if (!this.edges.some(e => 
            (e.from === node1.id && e.to === node2.id) || 
            (e.from === node2.id && e.to === node1.id)
        )) {
            this.edges.push({ from: node1.id, to: node2.id, weight });
            this.updateStatus(`Added edge ${node1.id}-${node2.id} with weight ${weight}`);
            this.draw();
        }
    }

    findNodeAt(x, y) {
        return this.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) < node.radius;
        });
    }

    updateNodeSelects() {
        const startSelect = document.getElementById('start-node');
        const endSelect = document.getElementById('end-node');
        
        // Clear existing options except first
        while (startSelect.options.length > 1) startSelect.remove(1);
        while (endSelect.options.length > 1) endSelect.remove(1);
        
        // Add node options
        this.nodes.forEach(node => {
            const option1 = new Option(`Node ${node.id}`, node.id);
            const option2 = new Option(`Node ${node.id}`, node.id);
            startSelect.add(option1);
            endSelect.add(option2);
        });
    }

    dijkstra(startId, endId) {
        const distances = {};
        const previous = {};
        const unvisited = new Set();
        const visited = [];

        // Initialize
        this.nodes.forEach(node => {
            distances[node.id] = node.id === startId ? 0 : Infinity;
            previous[node.id] = null;
            unvisited.add(node.id);
        });

        while (unvisited.size > 0) {
            // Get node with smallest distance
            let current = null;
            let minDist = Infinity;
            
            unvisited.forEach(nodeId => {
                if (distances[nodeId] < minDist) {
                    minDist = distances[nodeId];
                    current = nodeId;
                }
            });

            if (current === null || distances[current] === Infinity) break;

            // Mark as visited
            unvisited.delete(current);
            visited.push(current);

            // Record step for visualization
            this.algorithmSteps.push({
                current,
                distances: {...distances},
                visited: [...visited],
                previous: {...previous},
                description: `Visiting node ${current} (distance: ${distances[current]})`
            });

            // If we reached destination, we can stop
            if (current === endId) break;

            // Update neighbors
            this.edges.forEach(edge => {
                if (edge.from === current || edge.to === current) {
                    const neighbor = edge.from === current ? edge.to : edge.from;
                    
                    if (unvisited.has(neighbor)) {
                        const newDist = distances[current] + edge.weight;
                        
                        if (newDist < distances[neighbor]) {
                            distances[neighbor] = newDist;
                            previous[neighbor] = current;
                            
                            this.algorithmSteps.push({
                                current,
                                neighbor,
                                newDist,
                                distances: {...distances},
                                visited: [...visited],
                                previous: {...previous},
                                description: `Found shorter path to ${neighbor}: ${newDist}`
                            });
                        }
                    }
                }
            });
        }

        // Build path if reachable
        const path = [];
        let current = endId;
        
        while (current !== null) {
            path.unshift(current);
            current = previous[current];
        }

        return { distances, previous, path, visited };
    }

    async runDijkstra() {
        const startId = document.getElementById('start-node').value;
        const endId = document.getElementById('end-node').value;
        
        if (!startId || !endId) {
            this.updateStatus('Please select both start and end nodes');
            return;
        }

        this.resetVisualization();
        this.isRunning = true;
        
        const result = this.dijkstra(startId, endId);
        
        // Animate the steps
        for (let i = 0; i < this.algorithmSteps.length; i++) {
            if (!this.isRunning) break;
            
            const step = this.algorithmSteps[i];
            this.visualizeStep(step, i);
            this.updateStepDescription(step.description);
            this.updateDistancesDisplay(step.distances);
            
            await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
        }

        // Show final path
        if (result.path.length > 1) {
            this.highlightPath(result.path);
            this.updateStatus(`Shortest path: ${result.path.join(' → ')} (Distance: ${result.distances[endId]})`);
            document.getElementById('distance-display').textContent = `Total distance: ${result.distances[endId]}`;
        } else {
            this.updateStatus('No path found between selected nodes');
        }
        
        this.isRunning = false;
    }

    stepThrough() {
        if (this.algorithmSteps.length === 0) {
            const startId = document.getElementById('start-node').value;
            const endId = document.getElementById('end-node').value;
            
            if (!startId || !endId) {
                this.updateStatus('Please select both start and end nodes');
                return;
            }
            
            this.dijkstra(startId, endId);
            this.stepIndex = 0;
        }

        if (this.stepIndex < this.algorithmSteps.length) {
            const step = this.algorithmSteps[this.stepIndex];
            this.visualizeStep(step, this.stepIndex);
            this.updateStepDescription(step.description);
            this.updateDistancesDisplay(step.distances);
            this.stepIndex++;
        } else {
            this.updateStatus('Algorithm completed');
        }
    }

    visualizeStep(step, stepNumber) {
        this.draw();
        
        // Highlight current node
        const currentNode = this.nodes.find(n => n.id === step.current);
        if (currentNode) {
            this.ctx.beginPath();
            this.ctx.arc(currentNode.x, currentNode.y, currentNode.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fill();
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(currentNode.id, currentNode.x - 5, currentNode.y + 5);
        }

        // Highlight visited nodes
        step.visited.forEach(nodeId => {
            const node = this.nodes.find(n => n.id === nodeId);
            if (node) {
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = '#51cf66';
                this.ctx.fill();
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(node.id, node.x - 5, node.y + 5);
            }
        });

        // If step has a neighbor being updated, highlight that edge
        if (step.neighbor) {
            const neighborNode = this.nodes.find(n => n.id === step.neighbor);
            if (currentNode && neighborNode) {
                this.ctx.beginPath();
                this.ctx.moveTo(currentNode.x, currentNode.y);
                this.ctx.lineTo(neighborNode.x, neighborNode.y);
                this.ctx.strokeStyle = '#ffd43b';
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
                
                // Reset line width
                this.ctx.lineWidth = 2;
            }
        }
    }

    highlightPath(path) {
        for (let i = 0; i < path.length - 1; i++) {
            const node1 = this.nodes.find(n => n.id === path[i]);
            const node2 = this.nodes.find(n => n.id === path[i + 1]);
            
            if (node1 && node2) {
                this.ctx.beginPath();
                this.ctx.moveTo(node1.x, node1.y);
                this.ctx.lineTo(node2.x, node2.y);
                this.ctx.strokeStyle = '#40c057';
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
                
                // Highlight nodes on path
                [node1, node2].forEach(node => {
                    this.ctx.beginPath();
                    this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#40c057';
                    this.ctx.fill();
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillText(node.id, node.x - 5, node.y + 5);
                });
            }
        }
        this.ctx.lineWidth = 2;
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    updateStepDescription(description) {
        document.getElementById('current-step').textContent = description;
    }

    updateDistancesDisplay(distances) {
        const list = document.getElementById('distances-list');
        list.innerHTML = '';
        
        Object.entries(distances).forEach(([node, dist]) => {
            const div = document.createElement('div');
            div.className = 'distance-item';
            div.innerHTML = `
                <span class="node-label">${node}</span>
                <span class="distance-value">${dist === Infinity ? '∞' : dist}</span>
            `;
            list.appendChild(div);
        });
    }

    resetVisualization() {
        this.algorithmSteps = [];
        this.stepIndex = 0;
        this.isRunning = false;
        this.updateStepDescription('Waiting for input...');
        document.getElementById('distance-display').textContent = 'Total distance: -';
        document.getElementById('distances-list').innerHTML = '';
        this.draw();
    }

    clearAll() {
        this.nodes = [];
        this.edges = [];
        this.algorithmSteps = [];
        this.stepIndex = 0;
        this.selectedNode = null;
        this.updateNodeSelects();
        this.resetVisualization();
        this.updateStatus('Cleared all nodes and edges');
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges first
        this.edges.forEach(edge => {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            
            if (fromNode && toNode) {
                // Draw line
                this.ctx.beginPath();
                this.ctx.moveTo(fromNode.x, fromNode.y);
                this.ctx.lineTo(toNode.x, toNode.y);
                this.ctx.strokeStyle = '#495057';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Draw weight
                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;
                
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(midX - 15, midY - 10, 30, 20);
                
                this.ctx.fillStyle = '#495057';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(edge.weight, midX, midY + 5);
                this.ctx.textAlign = 'left';
            }
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            // Node circle
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#4dabf7';
            this.ctx.fill();
            this.ctx.strokeStyle = '#1c7ed6';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Node label
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.id, node.x, node.y + 6);
            this.ctx.textAlign = 'left';
        });
        
        // Draw selected node (if any)
        if (this.selectedNode) {
            this.ctx.beginPath();
            this.ctx.arc(this.selectedNode.x, this.selectedNode.y, this.selectedNode.radius + 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    new GraphVisualizer();
});