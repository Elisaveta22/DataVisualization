var format = d3.format(",");

// Set tooltips
var tip = d3
  .tip()
  .attr("class", "d3-tip")
  .offset([-10, 0])
  .html(function (d) {
    return (
      "<strong>Country: </strong><span class='details'>" +
      d.properties.name +
      "<br></span>" +
      "<strong>Population: </strong><span class='details'>" +
      format(d.population) +
      "</span>"
    );
  });

var margin = { top: 0, right: 50, bottom: 0, left: 0 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

var color = d3.scaleThreshold();

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
  .await(ready);

function ready(error, data, population) {
  var populationById = {};

  population.forEach(function (d) {
    populationById[d.id] = +d.population;
  });
  data.features.forEach(function (d) {
    d.population = populationById[d.id];
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
