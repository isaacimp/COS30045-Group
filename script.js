d3.csv("drug_use.csv").then(function (data) {
    data.forEach(d => {
        d.TIME_PERIOD = +d.TIME_PERIOD;
        d.OBS_VALUE = +d.OBS_VALUE;
        d.Pharmaceutical = d.Pharmaceutical;
    });

    const margin = { top: 40, right: 30, bottom: 60, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "#f4f4f9")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.TIME_PERIOD))
        .range([0, width])
        .nice();

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.OBS_VALUE)])
        .range([height, 0])
        .nice();

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Adjusted X-axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)  // Moving it closer to the X-axis
        .text("Year")
        .style("font-size", "14px")
        .style("fill", "#333");

    // Adjusted Y-axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)  // Centering the Y-axis label
        .attr("y", -margin.left + 20)  // Positioning it closer to the Y-axis
        .text("Drug Usage (Defined daily doses)")
        .style("font-size", "14px")
        .style("fill", "#333");

    const years = [...new Set(data.map(d => d.TIME_PERIOD))];
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

    function updateScatterPlot(selectedYear, selectedDrug) {
        const filteredData = data.filter(d => {
            return (selectedYear === "all" || d.TIME_PERIOD === +selectedYear) &&
                (selectedDrug === "all" || d.Pharmaceutical === selectedDrug);
        });

        yScale.domain([0, d3.max(filteredData, d => d.OBS_VALUE)]).nice();

        svg.select(".y-axis").transition().duration(500).call(d3.axisLeft(yScale));

        const circles = svg.selectAll("circle").data(filteredData);

        circles.exit().transition().duration(500).attr("r", 0).remove();

        circles.enter()
            .append("circle")
            .merge(circles)
            .transition().duration(500)
            .attr("cx", d => xScale(d.TIME_PERIOD))
            .attr("cy", d => yScale(d.OBS_VALUE))
            .attr("r", 6)
            .attr("fill", function(d, i) { 
                const colors = ['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1'];
                return colors[i % colors.length]; 
            });

        svg.selectAll("circle")
            .on("mouseover", function () {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("r", 10)
                    .attr("fill", "yellow");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("r", 6)
                    .attr("fill", function(d, i) { 
                        const colors = ['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1'];
                        return colors[i % colors.length]; 
                    });
            });
    }

    updateDrugDropdown("all");

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

    updateScatterPlot("all", "all");
});
