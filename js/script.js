const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let allData = []
let colorVar = "snowDepth";
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
        snowDepth: [20, 0]
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
    const width = 975;
    const height = 610;

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
        .attr("d", path)
        .attr('fill', d => colorScale(d));
        
    states.append("title")
        .text(d => d.properties.name);
    
    g.append("path")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));  
    
    window.mapStates = states;
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
        .transition()
        .duration(500)
        .attr("fill", d => colorScale(d))
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