const format = d3.format(",");
let currentTab = "home";

const margin = { top: 0, right: 50, bottom: 0, left: 0 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// load the data
queue()
  .defer(d3.json, "world_countries.json")
  .defer(d3.tsv, "world_population.tsv")
  .defer(d3.tsv, "monthly_salary.tsv")
  .await(ready);

// holds the data
let populationById = {};
let salaryById = {};
let featureData = {};
let populationSteps = [];
let salarySteps = [];

function ready(error, data, population, salary) {
  // calculate data

  let maxPopulation = Number(population[0].population);

  population.forEach(function (d) {
    populationById[d.id] = Number(d.population);
    if (Number(d.population) > maxPopulation) {
      maxPopulation = Number(d.population);
    }
  });
  data.features.forEach(function (d) {
    d.population = populationById[d.id];
  });

  let currentDivider = 1;
  for (let i = 9; i >= 0; i--) {
    populationSteps[i] = maxPopulation / currentDivider;
    currentDivider = currentDivider * 3;
  }

  const parseSalary = function (salary) {
    return Number(salary.replace("$", "").replace("\t", ""));
  };

  let maxSalary = parseSalary(salary[0].amount);

  salary.forEach(function (d) {
    const parsedSalary = parseSalary(d.amount);
    if (parsedSalary > maxSalary) {
      maxSalary = parsedSalary;
    }

    salaryById[d.name] = parsedSalary;
  });
  data.features.forEach(function (d) {
    d.amount = salaryById[d.properties.name];
  });

  currentDivider = 1;
  for (let i = 9; i >= 0; i--) {
    salarySteps[i] = maxSalary / currentDivider;
    currentDivider = currentDivider * 2;
  }

  featureData = data;

  // gets an array of all country names with undefined amount (salary)
  // remove this later
  const countriesWithUndefinedSalary = data.features
    .filter((f) => f.amount == null)
    .map((f) => f.properties.name);

  console.log(countriesWithUndefinedSalary);

  showOrHideAboutPage(false);
  showOrHideMap(true);
  setDataAndDrawMap();
}

// based on selected currentTab (home, salary or population), take appropriate data and draw appropriate map
function setDataAndDrawMap() {
  let tooltipFunction = null;
  let stepArray = null;
  let colorFunction = null;

  if (currentTab === "home") {
    // just country name
    tooltipFunction = function (d) {
      return (
        "<strong>Country: </strong><span class='details'>" +
        d.properties.name +
        "<br></span>"
      );
    };

    stepArray = populationSteps;
    colorFunction = function (d) {
      return "rgb(56,56,56)";
    };
  } else if (currentTab === "salary") {
    // country name + salary
    tooltipFunction = function (d) {
      return (
        "<strong>Country: </strong><span class='details'>" +
        d.properties.name +
        "<br></span>" +
        "<strong>Salary: </strong><span class='details'>$" +
        d.amount +
        "</span>"
      );
    };

    stepArray = salarySteps;
    colorFunction = function (d) {
      if (salaryById[d.properties.name] == null) {
        return color(500);
      } else {
        return color(salaryById[d.properties.name]);
      }
    };
  } else if (currentTab === "population") {
    // country name + population
    tooltipFunction = function (d) {
      return (
        "<strong>Country: </strong><span class='details'>" +
        d.properties.name +
        "<br></span>" +
        "<strong>Population: </strong><span class='details'>" +
        format(d.population) +
        "</span>"
      );
    };

    stepArray = populationSteps;
    colorFunction = function (d) {
      return color(populationById[d.id]);
    };
  }

  if (tooltipFunction == null) return;

  const tip = d3
    .tip()
    .attr("class", "d3-tip")
    .offset([120, 0])
    .html(tooltipFunction);

  const color = d3
    .scaleThreshold()
    .domain(stepArray)
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

  // clear the map
  d3.select("svg").remove();

  const svg = d3
    .select("#map-wrapper")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("class", "map");

  const projection = d3
    .geoMercator()
    .scale(140)
    .translate([width / 2, height / 1.5]);

  const path = d3.geoPath().projection(projection);

  svg.call(tip);

  svg
    .append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(featureData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style("fill", colorFunction)
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
      topojson.mesh(featureData.features, function (a, b) {
        return a.id !== b.id;
      })
    )
    // .datum(topojson.mesh(featureData.features, function(a, b) { return a !== b; }))
    .attr("class", "names")
    .attr("d", path);
}

function showOrHideAboutPage(show) {
  const aboutPage = document.getElementById("about-wrapper");
  if (show) {
    aboutPage.style.display = "block";
  } else {
    aboutPage.style.display = "none";
  }
}

function showOrHideMap(show) {
  const map = document.getElementById("map-wrapper");
  if (show) {
    map.style.display = "flex";
  } else {
    map.style.display = "none";
  }
}

function onTabClick(tabName) {
  currentTab = tabName;
  if (currentTab === "about") {
    showOrHideAboutPage(true);
    showOrHideMap(false);
  } else {
    setDataAndDrawMap();
    showOrHideAboutPage(false);
    showOrHideMap(true);
  }
}
