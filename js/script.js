const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let allData = []
let xVar, yVar, sizeVar, targetYear
let xScale, yScale, sizeScale

//Create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

function init() {
    d3.csv("./data/weather.csv", d => ({
        windspeed: +d.AWND,
        precipitation: +d.PRCP,
        snow: +d.SNOW,
        snowDepth : +d.SNWD, 
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
    }))
    .then(data => {
        console.log(data)
        allData = data
    })
    .catch(error => console.error('Error loading data:', error));
}
window.addEventListener('load', init);
