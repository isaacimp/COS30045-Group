const margin = { top: 40, right: 20, bottom: 50, left: 60 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const tooltip = d3.select("#tooltip");

const color = d3.scaleOrdinal(d3.schemeCategory10);

d3.csv("healthexpenditureaustralia.csv").then(expenditureData => {
    d3.csv("pharmamarketclean.csv").then(dosesData => {

        expenditureData.forEach(d => {
            d.real_expenditure_millions = +d.real_expenditure_millions;
        });

        dosesData.forEach(d => {
            d.TIME_PERIOD = +d.TIME_PERIOD;
            d.OBS_VALUE = +d.OBS_VALUE;
        });

        const svgBar = d3.select("#stacked-bar-chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const categories = [...new Set(expenditureData.map(d => d.area_of_expenditure))];
        const years = [...new Set(expenditureData.map(d => d.financial_year))];

        const expenditureByYear = d3.nest()
            .key(d => d.financial_year)
            .entries(expenditureData);

        const stack = d3.stack()
            .keys(categories)
            .value((d, key) => {
                const entry = d.values.find(v => v.area_of_expenditure === key);
                return entry ? entry.real_expenditure_millions : 0;
            });

        const layers = stack(expenditureByYear);

        const xBar = d3.scaleBand()
            .domain(years)
            .range([0, width])
            .padding(0.1);

        const yBar = d3.scaleLinear()
            .domain([0, d3.max(layers, layer => d3.max(layer, d => d[1]))])
            .range([height, 0]);

        svgBar.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xBar));

        svgBar.append("g")
            .call(d3.axisLeft(yBar));

        svgBar.selectAll(".layer")
            .data(layers)
            .enter().append("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => xBar(d.data.key)) 
            .attr("y", d => yBar(d[1]))
            .attr("height", d => yBar(d[0]) - yBar(d[1]))
            .attr("width", xBar.bandwidth())
            .on("mouseover", function (event, d) {
                tooltip.style("opacity", 1)
                    .text(`Year: ${d.data.key}, Value: ${d[1] - d[0]}`);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY}px`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        const svgLine = d3.select("#line-chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xLine = d3.scaleLinear()
            .domain(d3.extent(dosesData, d => d.TIME_PERIOD))
            .range([0, width]);

        const yLine = d3.scaleLinear()
            .domain([0, d3.max(dosesData, d => d.OBS_VALUE)])
            .range([height, 0]);

        svgLine.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xLine).tickFormat(d3.format("d")));

        svgLine.append("g")
            .call(d3.axisLeft(yLine));

        const line = d3.line()
            .x(d => xLine(d.TIME_PERIOD))
            .y(d => yLine(d.OBS_VALUE));

        svgLine.append("path")
            .datum(dosesData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        svgLine.selectAll(".dot")
            .data(dosesData)
            .enter().append("circle")
            .attr("cx", d => xLine(d.TIME_PERIOD))
            .attr("cy", d => yLine(d.OBS_VALUE))
            .attr("r", 4)
            .attr("fill", "red")
            .on("mouseover", function (event, d) {
                tooltip.style("opacity", 1)
                    .text(`Year: ${d.TIME_PERIOD}, Value: ${d.OBS_VALUE}`);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY}px`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
    });
});
