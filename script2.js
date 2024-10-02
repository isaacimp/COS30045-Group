d3.csv("drug_use.csv").then(function (data) {
    
    data.forEach(d => {
        d.TIME_PERIOD = +d.TIME_PERIOD;
        d.OBS_VALUE = +d.OBS_VALUE;
        d.Pharmaceutical = d.Pharmaceutical;
    });

    function updateScatterPlot(selectedYear, selectedDrug) {
        const chartDiv = document.getElementById('chart2');
        if (!chartDiv) {
            console.error("Chart container not found!");
            return;
        }
        const width = chartDiv.clientWidth;
        const height = chartDiv.clientHeight;
        const margin = { top: 40, right: 40, bottom: 120, left: 70 }; // Increased bottom margin for legend
        
        d3.select('#chart2').selectAll('*').remove();
        
        const svg = d3.select("#chart2")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const filteredData = data.filter(d => {
            return (selectedYear === "all" || d.TIME_PERIOD === +selectedYear) &&
                (selectedDrug === "all" || d.Pharmaceutical === selectedDrug);
        });

        const xScale = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => d.TIME_PERIOD))
            .range([0, width - margin.left - margin.right])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.OBS_VALUE)])
            .range([height - margin.top - margin.bottom, 0])
            .nice();

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([...new Set(filteredData.map(d => d.Pharmaceutical))]);

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", height - margin.top - margin.bottom + 40)
            .text("Year")
            .style("font-size", "14px")
            .style("fill", "#333");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height - margin.top - margin.bottom) / 2)
            .attr("y", -margin.left + 20)
            .text("Drug Usage (Defined daily doses per 1000 per day)")
            .style("font-size", "14px")
            .style("fill", "#333");

        const line = d3.line()
            .x(d => xScale(d.TIME_PERIOD))
            .y(d => yScale(d.OBS_VALUE));

        const drugs = d3.nest()
            .key(d => d.Pharmaceutical)
            .entries(filteredData);

        drugs.forEach(function(group) {
            group.values.sort((a, b) => a.TIME_PERIOD - b.TIME_PERIOD);
        });

        svg.selectAll(".line")
            .data(drugs)
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.key))
            .attr("stroke-width", 2)
            .attr("d", d => line(d.values));

        const circles = svg.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.TIME_PERIOD))
            .attr("cy", d => yScale(d.OBS_VALUE))
            .attr("r", 5)
            .attr("fill", d => colorScale(d.Pharmaceutical));

        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        circles.on("mouseover", function(d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Drug: ${d.Pharmaceutical}<br>Year: ${d.TIME_PERIOD}<br>Usage: ${d.OBS_VALUE.toFixed(2)}`)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });

        // Create legend
        const legendData = [...new Set(filteredData.map(d => d.Pharmaceutical))];
        const legendItemWidth = 150;
        const legendItemHeight = 20;
        const legendColumns = 5; // Set number of columns
        const legendRows = Math.ceil(legendData.length / legendColumns);

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, ${height - margin.top - margin.bottom + 60})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(legendData)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => {
                const row = Math.floor(i / legendColumns);
                const col = i % legendColumns;
                return `translate(${col * legendItemWidth}, ${row * legendItemHeight})`;
            });

        legendItems.append("circle")
            .attr("cx", 9)
            .attr("cy", 9)
            .attr("r", 5)
            .style("fill", d => colorScale(d));

        legendItems.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d)
            .style("font-size", "12px");
    }

    const years = [...new Set(data.map(d => d.TIME_PERIOD))];
    years.sort((a, b) => a - b);
    years.forEach(year => {
        d3.select("#year-select").append("option")
            .text(year)
            .attr("value", year);
    });

    function updateDrugDropdown(selectedYear) {
        const filteredData = selectedYear === "all" 
            ? data 
            : data.filter(d => d.TIME_PERIOD === +selectedYear);

        const uniquePharmaceuticals = [...new Set(filteredData.map(d => d.Pharmaceutical))];

        d3.select("#drug-select").selectAll("option").remove();
        d3.select("#drug-select").append("option").text("All Pharmaceuticals").attr("value", "all");

        uniquePharmaceuticals.forEach(drug => {
            d3.select("#drug-select").append("option")
                .text(drug)
                .attr("value", drug);
        });
    }

    d3.select("#year-select").on("change", function () {
        const selectedYear = d3.select(this).property("value");
        updateDrugDropdown(selectedYear);

        const selectedDrug = d3.select("#drug-select").property("value");
        updateScatterPlot(selectedYear, selectedDrug);
    });

    d3.select("#drug-select").on("change", function () {
        const selectedYear = d3.select("#year-select").property("value");
        const selectedDrug = d3.select(this).property("value");
        updateScatterPlot(selectedYear, selectedDrug);
    });

    updateDrugDropdown("all");
    updateScatterPlot("all", "all");
});