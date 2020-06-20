var format = d3.format(",");

// Set tooltips
var tip = d3
  .tip()
  .attr("class", "d3-tip")
  .offset([120, 0])
  .html(function (d) {
    return (
      "<strong>Country: </strong><span class='details'>" +
      d.properties.name +
      "<br></span>" +
      "<strong>Population: </strong><span class='details'>" +
      format(d.population) +
      "</span>" +
      "<br></span>" +
      "<strong>Salary: </strong><span class='details'>" +
      format(d.amount) +
      "</span>"
    );
  });

var margin = { top: 0, right: 50, bottom: 0, left: 0 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

var color = d3.scaleThreshold();

var color = d3
  .scaleThreshold()
  .domain([
    10000,
    100000,
    500000,
    1000000,
    5000000,
    10000000,
    50000000,
    100000000,
    500000000,
    1500000000,
  ])
  .range([
    "rgb(232,232,232)",
    "rgb(220,220,220)",
    "rgb(208,208,208)",
    "rgb(190,190,190)",
    "rgb(160,160,160)",
    "rgb(128,128,128)",
    "rgb(96,96,96)",
    "rgb(64,64,64)",
    "rgb(32,32,32)",
    "rgb(0,0,0)",
  ]);

var path = d3.geoPath();

var svg = d3
  .select("#map-wrapper")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("class", "map");

var projection = d3
  .geoMercator()
  .scale(140)
  .translate([width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

queue()
  .defer(d3.json, "world_countries.json")
  .defer(d3.tsv, "world_population.tsv")
  .defer(d3.tsv, "monthly_salary.tsv")
  .await(ready);

function ready(error, data, population, salary) {
  var populationById = {};
  var salaryById = {};

  population.forEach(function (d) {
    populationById[d.id] = +d.population;
  });
  data.features.forEach(function (d) {
    d.population = populationById[d.id];
  });

  salary.forEach(function (d) {
    salaryById[d.name] = +d.amount;
  });
  data.features.forEach(function (d) {
    d.amount = salaryById[d.name];
  });

  svg
    .append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style("fill", function (d) {
      return color(populationById[d.id]);
    })
    .style("stroke", "rgb(163, 230, 204)")
    .style("stroke-width", 1.5)
    .style("opacity", 0.7)
    // tooltips
    .style("stroke", "rgb(163, 230, 204)")
    .style("stroke-width", 0.3)
    .on("mouseover", function (d) {
      tip.show(d);

      d3.select(this)
        .style("opacity", 0.9)
        .style("stroke", "rgb(163, 230, 204)")
        .style("stroke-width", 3);
    })
    .on("mouseout", function (d) {
      tip.hide(d);

      d3.select(this)
        .style("opacity", 0.7)
        .style("stroke", "rgb(163, 230, 204)")
        .style("stroke-width", 0.3);
    });

  svg
    .append("path")
    .datum(
      topojson.mesh(data.features, function (a, b) {
        return a.id !== b.id;
      })
    )
    // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
    .attr("class", "names")
    .attr("d", path);
}
