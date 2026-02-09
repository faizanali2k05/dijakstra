class GraphVisualizer {
    constructor() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.hoveredNode = null;
        this.currentMode = 'add-node';
        this.isRunning = false;
        this.algorithmSteps = [];
        this.currentStep = 0;
        this.animationSpeed = 200;
        this.edgeWeightInput = document.getElementById('edge-weight');
        this.statusTimeout = null;
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.bindEvents();
        this.setMode('add-node');
        this.draw();
        this.updateStatus('Ready - Click "Add Node" then click on canvas to add nodes');
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - 50;
        this.draw();
    }

    bindEvents() {
        // Canvas click
        this.canvas.addEventListener('pointerdown', (e) => {
            this.handleCanvasClick(e);
        });

        this.canvas.addEventListener('pointermove', (e) => {
            this.handlePointerMove(e);
        });

        this.canvas.addEventListener('pointerleave', () => {
            this.hoveredNode = null;
            this.canvas.style.cursor = this.currentMode === 'add-edge' ? 'pointer' : 'crosshair';
            this.draw();
        });
        
        // Mode buttons
        document.getElementById('add-node-btn').addEventListener('click', () => {
            this.setMode('add-node');
        });
        
        document.getElementById('add-edge-btn').addEventListener('click', () => {
            this.setMode('add-edge');
        });
        
        // Control buttons
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearAll();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetVisualization();
        });
        
        document.getElementById('run-btn').addEventListener('click', (e) => {
            console.log('Run button clicked');
            this.runDijkstra();
        });
        
        document.getElementById('step-btn').addEventListener('click', () => {
            console.log('Step button clicked');
            this.stepThrough();
        });
        
        // Speed control
        document.getElementById('speed').addEventListener('input', (e) => {
            this.animationSpeed = 300 - (e.target.value * 25);
            const speeds = ['Very Slow', 'Slow', 'Medium', 'Fast', 'Very Fast'];
            const speedText = speeds[Math.min(Math.floor(e.target.value / 2), 4)];
            document.getElementById('speed-value').textContent = speedText;
        });
        
        // Node select changes
        document.getElementById('start-node').addEventListener('change', () => {
            this.updateDistancesDisplay();
        });
        
        document.getElementById('end-node').addEventListener('change', () => {
            this.updateDistancesDisplay();
        });

        if (this.edgeWeightInput) {
            this.edgeWeightInput.addEventListener('input', () => {
                this.updateStatus(`Edge weight set to ${this.getEdgeWeightValue()}`);
            });
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        this.selectedNode = null;
        
        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'add-node') {
            document.getElementById('add-node-btn').classList.add('active');
            this.updateStatus('Click anywhere on canvas to add nodes');
        } else if (mode === 'add-edge') {
            document.getElementById('add-edge-btn').classList.add('active');
            this.updateStatus('Click on first node, then click on second node to create edge');
        }
        
        this.draw();
    }

    handleCanvasClick(e) {
        if (this.isRunning) {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.currentMode === 'add-node') {
            this.addNode(x, y);
        } else if (this.currentMode === 'add-edge') {
            this.handleEdgeModeClick(x, y);
        }
    }

    handlePointerMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const hoveredNode = this.findNodeAt(x, y);

        if (hoveredNode !== this.hoveredNode) {
            this.hoveredNode = hoveredNode;
            this.canvas.style.cursor = hoveredNode ? 'pointer' : (this.currentMode === 'add-edge' ? 'pointer' : 'crosshair');
            this.draw();
        }
    }

    addNode(x, y) {
        // Check if too close to existing node
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const dx = node.x - x;
            const dy = node.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) {
                this.updateStatus('Too close to existing node. Try another location.');
                return;
            }
        }
        
        // Create new node ID (A, B, C, ...)
        const id = String.fromCharCode(65 + this.nodes.length);
        const node = {
            id: id,
            x: x,
            y: y,
            radius: 20,
            visited: false,
            distance: Infinity
        };
        
        this.nodes.push(node);
        this.updateNodeSelects();
        this.updateStatus(`Nice! Added node ${id}. Keep going or connect edges.`);
        this.draw();
    }

    handleEdgeModeClick(x, y) {
        const clickedNode = this.findNodeAt(x, y);
        
        if (!clickedNode) {
            this.updateStatus('Please click on a node');
            return;
        }
        
        if (this.selectedNode === null) {
            // First node selection
            this.selectedNode = clickedNode;
            this.updateStatus(`Selected node ${clickedNode.id}. Now click another node to create edge`);
            this.draw();
        } else if (this.selectedNode === clickedNode) {
            // Clicked same node - deselect
            this.selectedNode = null;
            this.updateStatus('Edge creation cancelled');
            this.draw();
        } else {
            // Second node selected
            this.createEdge(this.selectedNode, clickedNode);
        }
    }

    createEdge(node1, node2) {
        // Check if edge already exists
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            if ((edge.from === node1.id && edge.to === node2.id) || 
                (edge.from === node2.id && edge.to === node1.id)) {
                this.updateStatus(`Edge ${node1.id}-${node2.id} already exists`);
                this.selectedNode = null;
                this.draw();
                return;
            }
        }
        
        const weight = this.getEdgeWeightValue();
        if (isNaN(weight) || weight <= 0) {
            this.updateStatus('Invalid weight. Please enter a positive number.');
            return;
        }
        
        // Add edge
        this.edges.push({
            from: node1.id,
            to: node2.id,
            weight: weight,
            isPath: false
        });
        
        this.updateStatus(`Connected ${node1.id} → ${node2.id} (weight ${weight}).`);
        this.selectedNode = null;
        this.draw();
    }

    getEdgeWeightValue() {
        if (!this.edgeWeightInput) {
            return 10;
        }

        const rawValue = parseInt(this.edgeWeightInput.value, 10);
        return Number.isNaN(rawValue) ? 10 : rawValue;
    }

    findNodeAt(x, y) {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const dx = node.x - x;
            const dy = node.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < node.radius) {
                return node;
            }
        }
        return null;
    }

    updateNodeSelects() {
        const startSelect = document.getElementById('start-node');
        const endSelect = document.getElementById('end-node');
        
        // Clear existing options (keep first one)
        startSelect.innerHTML = '<option value="">Select start node</option>';
        endSelect.innerHTML = '<option value="">Select end node</option>';
        
        // Add node options
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            
            const startOption = document.createElement('option');
            startOption.value = node.id;
            startOption.textContent = `Node ${node.id}`;
            startSelect.appendChild(startOption);
            
            const endOption = document.createElement('option');
            endOption.value = node.id;
            endOption.textContent = `Node ${node.id}`;
            endSelect.appendChild(endOption);
        }
        
        // Update distances display
        this.updateDistancesDisplay();
    }

    clearAll() {
        if (!confirm('Are you sure you want to clear everything?')) {
            return;
        }
        
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.algorithmSteps = [];
        this.currentStep = 0;
        this.isRunning = false;
        
        this.updateNodeSelects();
        this.updateStatus('Cleared all nodes and edges');
        this.updateStepDescription('Not started');
        this.updateStepCounter(0, 0);
        document.getElementById('distance-display').textContent = 'Total distance: -';
        
        this.draw();
    }

    resetVisualization({ preserveRunning = false, preserveSteps = false } = {}) {
        if (!preserveSteps) {
            this.algorithmSteps = [];
            this.currentStep = 0;
        }

        if (!preserveRunning) {
            this.isRunning = false;
        }
        
        // Reset node states
        this.nodes.forEach(node => {
            node.visited = false;
            node.distance = Infinity;
        });
        
        // Reset edge states
        this.edges.forEach(edge => {
            edge.isPath = false;
        });
        
        this.updateStatus('Visualization reset. Ready for a new run.');
        if (!preserveSteps) {
            this.updateStepDescription('Not started');
            this.updateStepCounter(0, 0);
        }
        document.getElementById('distance-display').textContent = 'Total distance: -';
        
        this.draw();
    }

    runDijkstra() {
        console.log('runDijkstra called');
        
        const startSelect = document.getElementById('start-node');
        const endSelect = document.getElementById('end-node');
        const startId = startSelect.value;
        const endId = endSelect.value;
        
        console.log('Start ID:', startId, 'End ID:', endId);
        console.log('Nodes:', this.nodes);
        console.log('Edges:', this.edges);
        
        // Validation
        if (!startId || !endId) {
            this.updateStatus('Please select both start and end nodes');
            console.log('Validation failed: Missing start or end node');
            return;
        }
        
        if (startId === endId) {
            this.updateStatus('Start and end nodes must be different');
            return;
        }
        
        if (this.nodes.length < 2) {
            this.updateStatus('Need at least 2 nodes to run algorithm');
            return;
        }
        
        // Check if at least one edge exists
        if (this.edges.length === 0) {
            this.updateStatus('Need at least one edge to run algorithm');
            return;
        }
        
        console.log('All validations passed, running algorithm...');
        
        // Disable controls during animation
        this.setControlsEnabled(false);

        // Reset visualization state
        this.resetVisualization({ preserveRunning: true });

        this.isRunning = true;
        
        // Run Dijkstra algorithm
        const result = this.dijkstra(startId, endId);
        
        console.log('Dijkstra result:', result);
        
        // Start animation
        this.animateSteps(result, startId, endId);
    }

    async animateSteps(result, startId, endId) {
        console.log('Starting animation with', this.algorithmSteps.length, 'steps');
        
        for (let i = 0; i < this.algorithmSteps.length && this.isRunning; i++) {
            const step = this.algorithmSteps[i];
            console.log('Animating step', i + 1, 'of', this.algorithmSteps.length);
            
            this.visualizeStep(step);
            this.updateStepDescription(step.description);
            this.updateStepCounter(i + 1, this.algorithmSteps.length);
            this.updateDistancesDisplay(step.distances);
            
            await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
        }
        
        // Show final result
        if (result.path && result.path.length > 1) {
            console.log('Path found:', result.path);
            this.highlightPath(result.path);
            const totalDistance = result.distances[endId];
            this.updateStatus(`Shortest path found: ${result.path.join(' → ')} (Distance: ${totalDistance})`);
            document.getElementById('distance-display').textContent = `Total distance: ${totalDistance}`;
        } else {
            console.log('No path found');
            this.updateStatus('No path found yet. Add more edges or adjust weights and try again.');
        }
        
        // Re-enable controls
        this.setControlsEnabled(true);
        this.isRunning = false;
    }

    dijkstra(startId, endId) {
        console.log('Running Dijkstra from', startId, 'to', endId);
        
        this.algorithmSteps = [];
        
        const distances = {};
        const previous = {};
        const unvisited = new Set();
        const visited = [];
        
        // Initialize all nodes
        this.nodes.forEach(node => {
            distances[node.id] = node.id === startId ? 0 : Infinity;
            previous[node.id] = null;
            unvisited.add(node.id);
        });
        
        // Record initial state
        this.algorithmSteps.push({
            current: null,
            distances: {...distances},
            visited: [...visited],
            previous: {...previous},
            description: `Initialized: Start node ${startId} with distance 0, others with infinity`
        });
        
        while (unvisited.size > 0) {
            // Find unvisited node with smallest distance
            let currentNode = null;
            let minDistance = Infinity;
            
            unvisited.forEach(nodeId => {
                if (distances[nodeId] < minDistance) {
                    minDistance = distances[nodeId];
                    currentNode = nodeId;
                }
            });
            
            // If no reachable nodes left, break
            if (currentNode === null || distances[currentNode] === Infinity) {
                console.log('No more reachable nodes');
                break;
            }
            
            // Mark current node as visited
            unvisited.delete(currentNode);
            visited.push(currentNode);
            
            console.log(`Visiting node ${currentNode} with distance ${distances[currentNode]}`);
            
            this.algorithmSteps.push({
                current: currentNode,
                distances: {...distances},
                visited: [...visited],
                previous: {...previous},
                description: `Visiting node ${currentNode} (current distance: ${distances[currentNode]})`
            });
            
            // If we reached destination, we're done
            if (currentNode === endId) {
                console.log('Reached destination node');
                break;
            }
            
            // Update distances to neighbors
            this.edges.forEach(edge => {
                let neighbor = null;
                if (edge.from === currentNode) {
                    neighbor = edge.to;
                } else if (edge.to === currentNode) {
                    neighbor = edge.from;
                }
                
                if (neighbor && unvisited.has(neighbor)) {
                    const newDistance = distances[currentNode] + edge.weight;
                    
                    if (newDistance < distances[neighbor]) {
                        console.log(`Updating ${neighbor}: ${distances[currentNode]} + ${edge.weight} = ${newDistance}`);
                        distances[neighbor] = newDistance;
                        previous[neighbor] = currentNode;
                        
                        this.algorithmSteps.push({
                            current: currentNode,
                            neighbor: neighbor,
                            edgeWeight: edge.weight,
                            newDist: newDistance,
                            distances: {...distances},
                            visited: [...visited],
                            previous: {...previous},
                            description: `Updated ${neighbor}: ${distances[currentNode]} + ${edge.weight} = ${newDistance}`
                        });
                    }
                }
            });
        }
        
        // Build path from end to start
        const path = [];
        if (distances[endId] !== Infinity) {
            let currentNode = endId;
            while (currentNode !== null) {
                path.unshift(currentNode);
                currentNode = previous[currentNode];
            }
        }
        
        console.log('Final path:', path);
        console.log('Distances:', distances);
        
        // Record final result
        this.algorithmSteps.push({
            current: endId,
            distances: {...distances},
            visited: [...visited],
            previous: {...previous},
            path: [...path],
            description: path.length > 1 ? 
                `Path found: ${path.join(' → ')} (Total distance: ${distances[endId]})` :
                'No path found to destination node'
        });
        
        return { distances, path };
    }

    stepThrough() {
        const startSelect = document.getElementById('start-node');
        const endSelect = document.getElementById('end-node');
        const startId = startSelect.value;
        const endId = endSelect.value;
        
        if (!startId || !endId) {
            this.updateStatus('Please select both start and end nodes');
            return;
        }
        
        if (startId === endId) {
            this.updateStatus('Start and end nodes must be different');
            return;
        }

        if (this.nodes.length < 2) {
            this.updateStatus('Need at least 2 nodes to step through');
            return;
        }

        if (this.edges.length === 0) {
            this.updateStatus('Create at least one edge before stepping');
            return;
        }
        
        if (this.algorithmSteps.length === 0) {
            this.resetVisualization();
            this.dijkstra(startId, endId);
            this.currentStep = 0;
            this.updateStepCounter(0, this.algorithmSteps.length);
        }
        
        if (this.currentStep < this.algorithmSteps.length) {
            const step = this.algorithmSteps[this.currentStep];
            this.visualizeStep(step);
            this.updateStepDescription(step.description);
            this.updateStepCounter(this.currentStep + 1, this.algorithmSteps.length);
            this.updateDistancesDisplay(step.distances);
            this.currentStep++;
        } else {
            this.updateStatus('Algorithm completed');
        }
    }

    visualizeStep(step) {
        // Clear and redraw base graph
        this.draw();
        
        // Highlight visited nodes
        if (step.visited && step.visited.length > 0) {
            step.visited.forEach(nodeId => {
                const node = this.nodes.find(n => n.id === nodeId);
                if (node) {
                    this.drawNode(node, '#51cf66');
                }
            });
        }
        
        // Highlight current node
        if (step.current) {
            const currentNode = this.nodes.find(n => n.id === step.current);
            if (currentNode) {
                this.drawNode(currentNode, '#ff6b6b');
                
                // Highlight edge to neighbor if updating
                if (step.neighbor) {
                    const neighborNode = this.nodes.find(n => n.id === step.neighbor);
                    if (neighborNode) {
                        this.drawEdge(currentNode, neighborNode, '#ffd43b', 4);
                        
                        // Highlight the edge weight
                        const midX = (currentNode.x + neighborNode.x) / 2;
                        const midY = (currentNode.y + neighborNode.y) / 2;
                        
                        this.ctx.fillStyle = '#ffd43b';
                        this.ctx.fillRect(midX - 20, midY - 15, 40, 30);
                        this.ctx.fillStyle = '#2c3e50';
                        this.ctx.font = 'bold 16px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(step.edgeWeight, midX, midY + 6);
                    }
                }
            }
        }
    }

    highlightPath(path) {
        this.draw();
        
        for (let i = 0; i < path.length - 1; i++) {
            const node1 = this.nodes.find(n => n.id === path[i]);
            const node2 = this.nodes.find(n => n.id === path[i + 1]);
            
            if (node1 && node2) {
                // Draw highlighted edge
                this.drawEdge(node1, node2, '#40c057', 5);
                
                // Draw nodes in path
                this.drawNode(node1, '#40c057');
                this.drawNode(node2, '#40c057');
                
                // Update edge to show it's part of the path
                const edge = this.edges.find(e => 
                    (e.from === node1.id && e.to === node2.id) || 
                    (e.from === node2.id && e.to === node1.id)
                );
                
                if (edge) {
                    edge.isPath = true;
                    
                    // Update edge weight display
                    const midX = (node1.x + node2.x) / 2;
                    const midY = (node1.y + node2.y) / 2;
                    
                    this.ctx.fillStyle = '#40c057';
                    this.ctx.fillRect(midX - 20, midY - 15, 40, 30);
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(edge.weight, midX, midY + 6);
                }
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges first (so nodes appear on top)
        this.edges.forEach(edge => {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            
            if (fromNode && toNode) {
                const color = edge.isPath ? '#40c057' : '#495057';
                const width = edge.isPath ? 4 : 2;
                this.drawEdge(fromNode, toNode, color, width);
                
                // Draw weight
                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;
                
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(midX - 15, midY - 10, 30, 20);
                
                this.ctx.fillStyle = color;
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(edge.weight, midX, midY + 5);
            }
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            let color = '#4dabf7';
            if (this.hoveredNode === node) {
                color = '#74c0fc';
            }
            if (this.selectedNode === node) {
                color = '#ffd43b';
            }
            this.drawNode(node, color);
        });
        
        // Draw selected node highlight
        if (this.selectedNode) {
            this.ctx.beginPath();
            this.ctx.arc(this.selectedNode.x, this.selectedNode.y, this.selectedNode.radius + 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }

    drawNode(node, color = '#4dabf7') {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = '#1c7ed6';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Label
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.id, node.x, node.y);
    }

    drawEdge(fromNode, toNode, color = '#495057', width = 2) {
        this.ctx.beginPath();
        this.ctx.moveTo(fromNode.x, fromNode.y);
        this.ctx.lineTo(toNode.x, toNode.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    setControlsEnabled(enabled) {
        const controls = [
            'add-node-btn', 'add-edge-btn', 'clear-btn', 'reset-btn',
            'run-btn', 'step-btn', 'start-node', 'end-node', 'speed'
        ];
        
        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.disabled = !enabled;
            }
        });
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.classList.add('highlight');
            clearTimeout(this.statusTimeout);
            this.statusTimeout = setTimeout(() => {
                statusElement.classList.remove('highlight');
            }, 600);
            console.log('Status:', message);
        }
    }

    updateStepDescription(description) {
        const stepElement = document.getElementById('current-step');
        if (stepElement) {
            stepElement.textContent = description;
        }
    }

    updateStepCounter(current, total) {
        const counterElement = document.getElementById('step-counter');
        if (counterElement) {
            counterElement.textContent = `Step: ${current}/${total}`;
        }
    }

    updateDistancesDisplay(distances = null) {
        const list = document.getElementById('distances-list');
        
        if (!list) return;
        
        if (this.nodes.length === 0) {
            list.innerHTML = '<div class="distance-placeholder">No nodes yet</div>';
            return;
        }
        
        // Create distance map
        const distMap = distances || {};
        if (!distances) {
            this.nodes.forEach(node => {
                distMap[node.id] = Infinity;
            });
            
            const startId = document.getElementById('start-node').value;
            if (startId) {
                distMap[startId] = 0;
            }
        }
        
        // Clear and rebuild list
        list.innerHTML = '';
        
        this.nodes.forEach(node => {
            const div = document.createElement('div');
            div.className = 'distance-item';
            
            const dist = distMap[node.id];
            const displayDist = dist === Infinity ? '∞' : dist;
            
            div.innerHTML = `
                <span class="node-label">${node.id}</span>
                <span class="distance-value">${displayDist}</span>
            `;
            
            list.appendChild(div);
        });
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing GraphVisualizer');
    window.graphVisualizer = new GraphVisualizer();
});
