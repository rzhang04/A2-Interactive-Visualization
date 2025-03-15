const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 975;
const height = 610;

let allData = []
let colorVar = "minTemp";
const options = ["minTemp", "maxTemp", "snowDepth", "precipitation"]

const stateAbbreviations = {
    AL: "Alabama",
    AK: "Alaska",
    AS: "American Samoa",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    DC: "District of Columbia",
    FL: "Florida",
    GA: "Georgia",
    GU: "Guam",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    MP: "Northern Mariana Islands",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    PR: "Puerto Rico",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    VI: "Virgin Islands",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming"
};

const colorScale = (x) => {
    let d3ColorScale;
    let value = x?.properties?.state_info?.[colorVar];
    if (value === undefined || value === null) {
        return 'gray';  // coloring states gray for missing data
    }

    let domains = {
        minTemp: [70, 20], // for a flipped color scale
        maxTemp: [100, 20],
        precipitation: [0, 0.2],
        snowDepth: [0, 20]
    }

    if (colorVar == "minTemp" || colorVar == "maxTemp") {
        d3ColorScale = d3.scaleSequential()
            .domain(domains[colorVar])
            .interpolator(d3.interpolateRdYlGn);
    } else if (colorVar == "precipitation") {
        d3ColorScale = d3.scaleSequential()
            .domain(domains[colorVar])
            .interpolator(d3.interpolateBlues);
    } else if (colorVar == "snowDepth") {
        d3ColorScale = d3.scaleSequential()
            .domain(domains[colorVar])
            .interpolator(d3.interpolateBlues);
    }

    // Logging temperature for debugging
    console.log("State:", x.properties.name, conv(colorVar), value);
    
    // Return the color based on the value
    return d3ColorScale(value);
}

function createVis(us, weatherData) {
    const svg = d3.select("#vis").append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;")
        // .on("click", reset);

    const path = d3.geoPath();
    const g = svg.append("g");

    let states_topo = topojson.feature(us, us.objects.states);

    // Loop through each state in the topoJSON data
    states_topo.features.forEach(s => {
        let matchingWeather = weatherData.find(w => { //  matching weather data for the current state
            let fullStateName = stateAbbreviations[w.state.toUpperCase()];// Convert state abbreviation to full name
            return fullStateName && fullStateName.toLowerCase() === s.properties.name.toLowerCase();
        });

        if (matchingWeather) {
            s.properties.state_info = matchingWeather;
        } else {
            console.log(`Warning: No matching weather data found for state: ${s.properties.name}`);
        }
    });

    const states = g.append("g")
        .attr("cursor", "pointer")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .join("path")
        // .on("click", clicked)
        .on('mouseover', function (event, d){
            let state = d.properties.name;
            let abbrev = Object.entries(stateAbbreviations).find(([abbr, name]) => name === state)[0];
            d3.select('#tooltip')
                .style("display", "block")
                .html(
                    `<strong>${state}</strong><br/>
                    Min Temp: ${allData.find(e => e.state === abbrev).minTemp.toFixed(2)}°F<br>
                    Max Temp: ${allData.find(e => e.state === abbrev).maxTemp.toFixed(2)}°F<br>
                    Precipitation: ${allData.find(e => e.state === abbrev).precipitation.toFixed(2)}in<br>
                    Snow Depth: ${allData.find(e => e.state === abbrev).snowDepth.toFixed(2)}in`
                )
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (event, d) {
            d3.select('#tooltip')
                .style("display", "none")
        })
        .attr("d", path)
        .attr('fill', d => colorScale(d));
    
    g.append("path")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));  
    
    window.mapStates = states;

    g.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 59)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .text("U.S. Map of Average Minimum Temperature, Maximum Temperature, Precipitation, and Snow Depth per State in 2017");
}    

async function init() {
    try {
        // Load weather data
        let weatherData = await d3.csv("./data/weather.csv", d => ({
            windspeed: +d.AWND,
            precipitation: +d.PRCP,
            snow: +d.SNOW,
            snowDepth: +d.SNWD, 
            avgTemp: +d.TAVG, 
            maxTemp: +d.TMAX, 
            minTemp: +d.TMIN, 
            fastest5SecdWindDir: +d.WDF5,
            fastest5SecdWindSpeed: +d.WSF5,
            date: +d.date,
            elevation: +d.elevation,
            latitude: +d.latitude,
            longitude: +d.longitude,
            state: d.state,
            station: d.station
        }));

        // Group weather data by state
        const groupedByState = weatherData.reduce((acc, curr) => {
            // Use the state abbreviation as the key
            const state = curr.state.toUpperCase();
            if (!acc[state]) {
                acc[state] = [];
            }
            acc[state].push(curr);
            return acc;
        }, {});

        // Calculate the average values for each state's weather data
        const averagedStateData = Object.keys(groupedByState).map(stateKey => {
            const stateData = groupedByState[stateKey];
            const avgData = {
                state: stateKey,
                minTemp: d3.mean(stateData, d => d.minTemp),
                maxTemp: d3.mean(stateData, d => d.maxTemp),
                precipitation: d3.mean(stateData, d => d.precipitation),
                snowDepth: d3.mean(stateData, d => d.snowDepth)
            };
            return avgData;
        });

        console.log("Averaged Weather Data:", averagedStateData);
        allData = averagedStateData;

        // Load map data
        let us = await d3.json("./data/states-albers-10m.json");
        console.log("Map Data:", us);
        
        setUpSelector();
        createVis(us, averagedStateData);
        updateLegend();

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

window.addEventListener('load', init);

function setUpSelector() {
    // dropdown to filter map data
    d3.selectAll('#colorVariable')
        .selectAll("option")
        .data(options)
        .enter()
        .append('option')
        .text(d => conv(d))
        .attr("value", d => d);

    // react on change
    d3.selectAll('#colorVariable')
        .on("change", function() {
            colorVar = d3.select(this).property("value");
            updateVis();
        });
    d3.select('#colorVariable').property('value', colorVar);
}

function updateVis() {
    window.mapStates
        .on('mouseover', function (event, d){
            let state = d.properties.name;
            let abbrev = Object.entries(stateAbbreviations).find(([abbr, name]) => name === state)[0];
            d3.select('#tooltip')
                .style("display", "block")
                .html(
                    `<strong>${state}</strong><br/>
                    Min Temp: ${allData.find(e => e.state === abbrev).minTemp.toFixed(2)}°F<br>
                    Max Temp: ${allData.find(e => e.state === abbrev).maxTemp.toFixed(2)}°F<br>
                    Precipitation: ${allData.find(e => e.state === abbrev).precipitation.toFixed(2)}in<br>
                    Snow Depth: ${allData.find(e => e.state === abbrev).snowDepth.toFixed(2)}in`
                )
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (event, d) {
            d3.select('#tooltip')
                .style("display", "none")
        })
        .transition()
        .duration(500)
        .attr("fill", d => colorScale(d))
    updateLegend();
}

function updateLegend() {
    d3.select("#legend").html(""); // clear old legend
    let titles = {
        minTemp: "Average Minimum Temperature (°F)",
        maxTemp: "Average Maximum Temperature (°F)",
        precipitation: "Average Precipitation (in)",
        snowDepth: "Average Snow Depth (in)"
    };

    let legend;
    let domains = {
        minTemp: [70, 20], 
        maxTemp: [100, 20],
        precipitation: [0, 0.2],
        snowDepth: [0, 20]
    }
    
    if (colorVar == "minTemp" || colorVar == "maxTemp") {
        legend = Legend(d3.scaleSequential(domains[colorVar], d3.interpolateRdYlGn), {
            title: titles[colorVar]
        })
    } else if (colorVar == "precipitation") {
        legend = Legend(d3.scaleSequential(domains[colorVar], d3.interpolateBlues), {
            title: titles[colorVar]
        })
    } else if (colorVar == "snowDepth") {
        legend = Legend(d3.scaleSequential(domains[colorVar], d3.interpolateBlues), {
            title: titles[colorVar]
        })
    }
    d3.select("#legend").node().append(legend);
}

// convert variable names to natural names
function conv(val) {
    if (val == "minTemp") {
        return "Average Minimum Temperature";
    } else if (val == "maxTemp") {
        return "Average Maximum Temperature";
    } else if (val == "precipitation") {
        return "Precipitation"
    } else if (val == "snowDepth") {
        return "Snow Depth"
    }
}

// Mike Bosnan's color legend from Observable
function Legend(color, {
    title,
    tickSize = 6,
    width = 320, 
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64,
    tickFormat,
    tickValues
  } = {}) {
  
    function ramp(color, n = 256) {
      const canvas = document.createElement("canvas");
      canvas.width = n;
      canvas.height = 1;
      const context = canvas.getContext("2d");
      for (let i = 0; i < n; ++i) {
        context.fillStyle = color(i / (n - 1));
        context.fillRect(i, 0, 1, 1);
      }
      return canvas;
    }
  
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");
  
    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;
  
    // Continuous
    if (color.interpolate) {
      const n = Math.min(color.domain().length, color.range().length);
  
      x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));
  
      svg.append("image")
          .attr("x", marginLeft)
          .attr("y", marginTop)
          .attr("width", width - marginLeft - marginRight)
          .attr("height", height - marginTop - marginBottom)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }
  
    // Sequential
    else if (color.interpolator) {
      x = Object.assign(color.copy()
          .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
          {range() { return [marginLeft, width - marginRight]; }});
  
      svg.append("image")
          .attr("x", marginLeft)
          .attr("y", marginTop)
          .attr("width", width - marginLeft - marginRight)
          .attr("height", height - marginTop - marginBottom)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", ramp(color.interpolator()).toDataURL());
  
      // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
      if (!x.ticks) {
        if (tickValues === undefined) {
          const n = Math.round(ticks + 1);
          tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
        }
        if (typeof tickFormat !== "function") {
          tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
        }
      }
    }
  
    // Threshold
    else if (color.invertExtent) {
      const thresholds
          = color.thresholds ? color.thresholds() // scaleQuantize
          : color.quantiles ? color.quantiles() // scaleQuantile
          : color.domain(); // scaleThreshold
  
      const thresholdFormat
          = tickFormat === undefined ? d => d
          : typeof tickFormat === "string" ? d3.format(tickFormat)
          : tickFormat;
  
      x = d3.scaleLinear()
          .domain([-1, color.range().length - 1])
          .rangeRound([marginLeft, width - marginRight]);
  
      svg.append("g")
        .selectAll("rect")
        .data(color.range())
        .join("rect")
          .attr("x", (d, i) => x(i - 1))
          .attr("y", marginTop)
          .attr("width", (d, i) => x(i) - x(i - 1))
          .attr("height", height - marginTop - marginBottom)
          .attr("fill", d => d);
  
      tickValues = d3.range(thresholds.length);
      tickFormat = i => thresholdFormat(thresholds[i], i);
    }
  
    // Ordinal
    else {
      x = d3.scaleBand()
          .domain(color.domain())
          .rangeRound([marginLeft, width - marginRight]);
  
      svg.append("g")
        .selectAll("rect")
        .data(color.domain())
        .join("rect")
          .attr("x", x)
          .attr("y", marginTop)
          .attr("width", Math.max(0, x.bandwidth() - 1))
          .attr("height", height - marginTop - marginBottom)
          .attr("fill", color);
  
      tickAdjust = () => {};
    }
  
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
          .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
          .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
          .tickSize(tickSize)
          .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
          .attr("x", marginLeft)
          .attr("y", marginTop + marginBottom - height - 6)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .attr("class", "title")
          .text(title));
  
    return svg.node();
  }