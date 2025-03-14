const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;


let allData = []

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

const colorScale = (x) => { //this is for avgTemp for example, was just trying to see and make it work

    // Ensure we are accessing the temperature value properly
    let temp = x?.properties?.state_info?.avgTemp;

    if (temp === 0) {
        return 'gray';  // coloring states gray for missing data
    }

    let d3ColorScale = d3.scaleLinear().domain([-60, -40, -20, 0, 20, 40, 60, 80, 100])
    .range(['#eed4e8', '#bd5ba6', '#6b1280', '#04008a', '#3e8cf5', '#abfc8a', '#ee8431', '#76150c','#4d0c05']);

    // Logging temperature for debugging
    console.log("State:", x.properties.name, "Temperature:", temp);
    
    // Return the color based on the temp value
    return d3ColorScale(temp);
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
        let matchingWeather = weatherData.find(w => {// Find the matching weather data for the current state
            
            let fullStateName = stateAbbreviations[w.state.toUpperCase()];// Convert state abbreviation to full name
            return fullStateName && fullStateName.toLowerCase() === s.properties.name.toLowerCase();
        });

        if (matchingWeather) {
            s.properties.state_info = matchingWeather;
        } else {
            console.log(`Warning: No matching weather data found for state: ${s.properties.name}`);
        }
    });

    console.log("Merged Data:", states_topo.features);

    const states = g.append("g")
        //.attr("fill", "#444")
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
