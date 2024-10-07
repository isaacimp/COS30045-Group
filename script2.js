// Load the CSV file and parse the data
d3.csv("drug_use.csv").then(function (data) {

    // Convert string values to numbers for TIME_PERIOD and OBS_VALUE
    data.forEach(d => {
        d.TIME_PERIOD = +d.TIME_PERIOD;
        d.OBS_VALUE = +d.OBS_VALUE;
        d.Pharmaceutical = d.Pharmaceutical;
    });

    // Function to generate color scheme
    function generateColors(n) {
        const baseColors = [
            "#8dd3c7", "#ffdfb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
            "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f",
            "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c",
            "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffcf99", "#b15928"
        ];

        // If the number of drugs is within the base color set, use it
        if (n <= baseColors.length) {
            return baseColors.slice(0, n);
        } else {
            // If more colors are needed, generate additional colors using HSL
            const additionalColors = d3.range(n - baseColors.length).map(i => 
                d3.hsl(360 * i / (n - baseColors.length), 0.4, 0.8).toString()
            );
            return baseColors.concat(additionalColors);
        }
    }

    // update the scatter plot based on selected year and drug
    function updateScatterPlot(selectedYear, selectedDrug) {
        const chartDiv = document.getElementById('chart2');
        if (!chartDiv) {
            console.error("Chart container not found!");
            return;
        }
        const width = chartDiv.clientWidth;
        const height = chartDiv.clientHeight;
        const margin = { top: 40, right: 40, bottom: 280, left: 70 }; // Margin for chart layout and space for the legend

        // Clear any existing chart elements
        d3.select('#chart2').selectAll('*').remove();

        // Create SVG container for the scatter plot
        const svg = d3.select("#chart2")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Filter data based on year and drug
        const filteredData = data.filter(d => {
            return (selectedYear === "all" || d.TIME_PERIOD === +selectedYear) &&
                (selectedDrug === "all" || d.Pharmaceutical === selectedDrug);
        });

        // Define x-scale and y-scale 
        const xScale = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => d.TIME_PERIOD))
            .range([0, width - margin.left - margin.right])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.OBS_VALUE)])
            .range([height - margin.top - margin.bottom, 0])
            .nice();

        // Generate unique list of drugs for color mapping
        const uniqueDrugs = [...new Set(filteredData.map(d => d.Pharmaceutical))];
        const colorScale = d3.scaleOrdinal()
            .domain(uniqueDrugs)
            .range(generateColors(uniqueDrugs.length));

        // Add x-axis to the scatter plot
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

        // Add y-axis to the scatter plot
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));

        // Add label for the x-axis
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", height - margin.top - margin.bottom + 40)
            .text("Year")
            .style("font-size", "14px")
            .style("fill", "#333");

        // Add label for the y-axis
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height - margin.top - margin.bottom) / 2)
            .attr("y", -margin.left + 20)
            .text("Drug Usage (Defined daily doses per 1000 per day)")
            .style("font-size", "14px")
            .style("fill", "#333");

        // Create a line generator for plotting drug usage over time
        const line = d3.line()
            .x(d => xScale(d.TIME_PERIOD))
            .y(d => yScale(d.OBS_VALUE));

        // Group data by pharmaceutical name
        const drugs = d3.nest()
            .key(d => d.Pharmaceutical)
            .entries(filteredData);

        // Sort each drug's data by year
        drugs.forEach(function(group) {
            group.values.sort((a, b) => a.TIME_PERIOD - b.TIME_PERIOD);
        });

        // Plot the lines for each drug
        svg.selectAll(".line")
            .data(drugs)
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.key))
            .attr("stroke-width", 2)
            .attr("d", d => line(d.values));

        // Plot circles for each data point (year and drug usage)
        const circles = svg.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.TIME_PERIOD))
            .attr("cy", d => yScale(d.OBS_VALUE))
            .attr("r", 5)
            .attr("fill", d => colorScale(d.Pharmaceutical));

        // Create a tooltip for displaying data details on hover
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        // Show tooltip on hover and position it based on mouse event
        circles.on("mouseover", function(d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Drug: ${d.Pharmaceutical}<br>Year: ${d.TIME_PERIOD}<br>Usage: ${d.OBS_VALUE.toFixed(2)}`)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });

        // Create a legend to identify the different pharmaceuticals
        const legendData = [...new Set(filteredData.map(d => d.Pharmaceutical))];
        const legendItemHeight = 35;
        const legendItemWidth = 200;
        const legendColumns = Math.floor((width - margin.left - margin.right) / legendItemWidth);
        const legendRows = Math.ceil(legendData.length / legendColumns);

        // Add a legend to the bottom of the chart
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, ${height - margin.top - margin.bottom + 80})`);

        // Append color boxes and drug names to the legend
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
            .style("font-size", "12px")
            .call(wrap, legendItemWidth - 24);

        // Wrap long text in the legend to fit within the legend box
        function wrap(text, width) {
            text.each(function() {
                let text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).
                    tspan = text.append("tspan").attr("x", 24).attr("y", y).attr("dy", dy + "em");

                // Add words to the line until the length exceeds the specified width
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 24).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

        // Adjust the height of the SVG container to accommodate the legend
        const newHeight = height + legendRows * legendItemHeight;
        d3.select("#chart2 svg").attr("height", newHeight);
    }

    // years from the data and populate the year dropdown
    const years = [...new Set(data.map(d => d.TIME_PERIOD))];
    years.sort((a, b) => a - b);  // Sort years in ascending order
    years.forEach(year => {
        d3.select("#year-select").append("option")
            .text(year)
            .attr("value", year);
    });

    // Function to update the drug dropdown based on the selected year
    function updateDrugDropdown(selectedYear) {
        const filteredData = selectedYear === "all" 
            ? data 
            : data.filter(d => d.TIME_PERIOD === +selectedYear);

        const uniquePharmaceuticals = [...new Set(filteredData.map(d => d.Pharmaceutical))];

        // Clear and update the drug dropdown options
        d3.select("#drug-select").selectAll("option").remove();
        d3.select("#drug-select").append("option").text("All Pharmaceuticals").attr("value", "all");

        uniquePharmaceuticals.forEach(drug => {
            d3.select("#drug-select").append("option")
                .text(drug)
                .attr("value", drug);
        });
    }

    // Event listener for changes in the year dropdown
    d3.select("#year-select").on("change", function () {
        const selectedYear = d3.select(this).property("value");
        updateDrugDropdown(selectedYear);

        const selectedDrug = d3.select("#drug-select").property("value");
        updateScatterPlot(selectedYear, selectedDrug);
    });

    // Event listener for changes in the drug dropdown
    d3.select("#drug-select").on("change", function () {
        const selectedYear = d3.select("#year-select").property("value");
        const selectedDrug = d3.select(this).property("value");
        updateScatterPlot(selectedYear, selectedDrug);
    });

    // Initialize with all years and all drugs selected
    updateDrugDropdown("all");
    updateScatterPlot("all", "all");
});
