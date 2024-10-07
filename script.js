let data = [];
let hierarchy = ['state', 'area_of_expenditure', 'broad_source_of_funding']; 
let root; 
let current; 

// Function to process data
function processData(data, levels) {
    const nestedData = d3.nest(); // Create D3 nest object for grouping
    levels.forEach(level => {
        nestedData.key(d => d[level]); // Group data by state, expenditure...
    });
    nestedData.rollup(leaves => d3.sum(leaves, d => +d.real_expenditure_millions)); 

    return d3.hierarchy({ values: nestedData.entries(data) }, d => d.values)
        .sum(d => d.value) // Set the value for each node based on expenditure
        .sort((a, b) => b.value - a.value); // Sort nodes by value
}

const margin = { top: 20, right: 60, bottom: 60, left: -60 }; // Margins for the canvas
const width = 900 - margin.left - margin.right; // Width of the canvas minus margins
const height = 500 - margin.top - margin.bottom; // Height of the canvas minus margins  

// Function to update the visualization
function updateVisualization(node) {
    const chartDiv = document.getElementById('chart'); // Get the chart div element
    const width = chartDiv.clientWidth; // Get the width of the chart div
    const height = chartDiv.clientHeight; // Get the height of the chart div
    const margin = { top: 40, right: 10, bottom: 40, left: 10 }; // Margins for the visualization

    d3.select('#chart').selectAll('*').remove(); // Clear the previous chart

    // Create an SVG element for the chart
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`); // Apply margin transformation

    // Create a treemap layout with padding
    const treemap = d3.treemap()
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom]) // Set size of treemap
        .paddingTop(28) 
        .paddingRight(7) 
        .paddingInner(3) 
        .round(true); 

    treemap(node); // Generate the treemap from the data

    const color = d3.scaleOrdinal(d3.schemeSet3); // Set a color scale for the treemap

    // Select all 'g' elements and position them
    const cell = svg.selectAll('g')
        .data(node.children)
        .enter().append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`); // Translate based on position

    // Append rectangles to each cell
    cell.append('rect')
        .attr('width', d => d.x1 - d.x0) // Set width 
        .attr('height', d => d.y1 - d.y0) // Set height 
        .attr('fill', d => color(d.data.key)); // Fill with color
    cell.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => color(d.data.key))
        .attr('opacity', 0.5); // Set opacity to 50%

    // Append text for value
    cell.append('text')
        .attr('x', d => d.x1 - d.x0 - 4) // Align text near the right edge
        .attr('y', d => d.y1 - d.y0 - 4) // Align text near the bottom edge
        .text(d => `$${(d.value / 1000).toFixed(2)}`) // Display value as a formatted string
        .attr('font-size', d => Math.min(24, (d.x1 - d.x0) / 5) + 'px') // Set dynamic font size
        .attr('fill', '#black') // Set text color
        .attr('text-anchor', 'end'); // Align text to the right

    // Append text for node key (if the node is wide enough)
    cell.append('text')
        .attr('x', d => (d.x1 - d.x0) / 2) // Center text horizontally
        .attr('y', d => (d.y1 - d.y0) / 2) // Center text vertically
        .attr('dy', '.35em') // Adjust text position slightly
        .attr('text-anchor', 'middle') // Center text alignment
        .text(d => {
            // Show text only if the node's width is greater than 50px
            return (d.x1 - d.x0 > 50) ? d.data.key : '';
        })
        .style('font-size', function (d) {
            const boxWidth = d.x1 - d.x0;
            const boxHeight = d.y1 - d.y0;
            return Math.max(10, Math.min(boxWidth / d.data.key.length, boxHeight / 3)) + 'px'; // Adjust font size dynamically
        })
        .attr('fill', '#000'); // Set text color to black

    // Tooltip for displaying information on hover
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0); // Set opacity to 0

    // Display tooltip on mouseover and hide it on mouseout
    cell.on('mousemove', function (d) {
        tooltip.style('opacity', 0.9)
            .html(`<strong>${d.data.key}</strong><br>Value: $${(d.value / 1000).toFixed(2)} billion`) // Tooltip content
            .style('left', (d3.event.pageX + 10) + 'px') // Position tooltip near cursor
            .style('top', (d3.event.pageY - 28) + 'px');
    }).on('mouseout', function () {
        tooltip.style('opacity', 0); // Hide tooltip
    });

    // Create legend
    const legendData = colorScale.domain();
    const legendItemWidth = 200; // Width for each legend item
    const legendItemHeight = 20; // Height for each legend item
    const legendColumns = Math.floor((width - margin.left - margin.right) / legendItemWidth); //columns in legend
    const legendRows = Math.ceil(legendData.length / legendColumns); // rows in legend

    // Append a group for the legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom + 40})`); // Position the legend below the treemap

    // Create a legend item for each data point
    const legendItems = legend.selectAll(".legend-item")
        .data(legendData)
        .enter().append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => {
            const row = Math.floor(i / legendColumns);
            const col = i % legendColumns;
            return `translate(${col * legendItemWidth}, ${row * legendItemHeight})`; // Position legend items in rows and columns
        });

    // Append a rectangle for each legend item
    legendItems.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colorScale); // Fill rectangle with the corresponding color

    // Append text for each legend item
    legendItems.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d) // Display the key for each legend item
        .style("font-size", "12px"); // Set text size

    // Append a title to treemap
    svg.append('text')
        .attr('x', 4) // Position the title
        .attr('y', 18)
        .text(node.data.key) // Set title text
        .attr('font-weight', 'bold') // Make text bold
        .attr('font-size', 18); // Set  font size
}

// Load dataset and start visualization
d3.csv('healthexpenditureaustralia_processed.csv').then(function (csvData)
{
    data = csvData;
    root = processData(data, hierarchy);
    current = root;
    d3.select('#hierarchy-select').property('value', 'state').dispatch('change');
    updateVisualization(root);
}).catch(function (error) {
    console.log('Error loading the CSV file:', error);
});

d3.select('#hierarchy-select').on('change', function () {
    hierarchy = this.value.split(',');
    root = processData(data, hierarchy);
    current = root;
    updateVisualization(root);
});

window.addEventListener('resize', () => updateVisualization(current));
