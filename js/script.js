const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let allData = []
let xVar, yVar, sizeVar, targetYear
let xScale, yScale, sizeScale

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

    const states = g.append("g")
        .attr("fill", "#444")
        .attr("cursor", "pointer")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .join("path")
        // .on("click", clicked)
        .attr("d", path);

    console.log("topoJSON: ", topojson.feature(us, us.objects.states))
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

        console.log("Weather Data:", weatherData);
        allData = weatherData;

        // Load map data
        let us = await d3.json("./data/states-albers-10m.json");
        console.log("Map Data:", us);

        // Call visualization function
        createVis(us, weatherData);
    } catch (error) {
        console.error("Error loading data:", error);
    }
}
window.addEventListener('load', init);
