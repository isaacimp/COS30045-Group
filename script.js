let data = [];
let hierarchy = ['state', 'area_of_expenditure', 'broad_source_of_funding'];
let root;
let current;

function processData(data, levels) {
    const nestedData = d3.nest();
    levels.forEach(level => {
        nestedData.key(d => d[level]);
    });
    nestedData.rollup(leaves => d3.sum(leaves, d => +d.real_expenditure_millions));

    return d3.hierarchy({ values: nestedData.entries(data) }, d => d.values)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
}
const margin = { top: 20, right: 60, bottom: 60, left: -60 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;  
function updateVisualization(node) {
    const chartDiv = document.getElementById('chart');
    const width = chartDiv.clientWidth;
    const height = chartDiv.clientHeight;
    const margin = { top: 40, right: 10, bottom: 40, left: 10 };

    d3.select('#chart').selectAll('*').remove();

    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const treemap = d3.treemap()
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
        .paddingTop(28)
        .paddingRight(7)
        .paddingInner(3)
        .round(true);

    treemap(node);

    const color = d3.scaleOrdinal(d3.schemeSet3);

    const cell = svg.selectAll('g')
        .data(node.children)
        .enter().append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    cell.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => color(d.data.key))

    cell.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => color(d.data.key))  
        .attr('opacity', 0.5)  

    
    cell.append('text')
        .attr('x', d => d.x1 - d.x0 - 4)
        .attr('y', d => d.y1 - d.y0 - 4)
        .text(d => `$${(d.value / 1000).toFixed(2)}`)
        .attr('font-size', d => Math.min(24, (d.x1 - d.x0) / 5) + 'px')
        .attr('fill', '#black')
        .attr('text-anchor', 'end');

    cell.append('text')
        .attr('x', d => (d.x1 - d.x0) / 2)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .attr('dy', '.35em') 
        .attr('text-anchor', 'middle')  
        .text(d => {
            // show text if box width is greater than 50px
            return (d.x1 - d.x0 > 50) ? d.data.key : '';
        })
        .style('font-size', function (d) {
            const boxWidth = d.x1 - d.x0;
            const boxHeight = d.y1 - d.y0;
            return Math.max(10, Math.min(boxWidth / d.data.key.length, boxHeight / 3)) + 'px';
        })
        .attr('fill', '#000'); 

        const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    cell.on('mousemove', function (d) {
        tooltip.style('opacity', 0.9)
            .html(`<strong>${d.data.key}</strong><br>Value: $${(d.value / 1000).toFixed(2)} billion`)
            .style('left', (d3.event.pageX + 10) + 'px')
            .style('top', (d3.event.pageY - 28) + 'px');
    }).on('mouseout', function () {
        tooltip.style('opacity', 0);
    });
    const legendData = colorScale.domain();
        const legendItemWidth = 200; // Increased width for longer columns
        const legendItemHeight = 20;
        const legendColumns = Math.floor((width - margin.left - margin.right) / legendItemWidth);
        const legendRows = Math.ceil(legendData.length / legendColumns);

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, ${height - margin.top - margin.bottom + 40})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(legendData)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => {
                const row = Math.floor(i / legendColumns);
                const col = i % legendColumns;
                return `translate(${col * legendItemWidth}, ${row * legendItemHeight})`;
            });

        legendItems.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", colorScale);

        legendItems.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d)
            .style("font-size", "12px");

    svg.append('text')
        .attr('x', 4)
        .attr('y', 18)
        .text(node.data.key)
        .attr('font-weight', 'bold')
        .attr('font-size', 18);

}


// load dataset
d3.csv('healthexpenditureaustralia_processed.csv').then(function (csvData) {
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