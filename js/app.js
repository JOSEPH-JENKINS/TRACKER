const BASE_URL = "https://retro.umoiq.com/service/publicXMLFeed";
const AGENCY = "lametro-rail";
const GLOBAL_PARSER = new DOMParser();
var TRAINS = [];
var STOPS;

// SET PAGE HEIGHT
const setHeightVariable = () => {
    const verticalHeight = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${verticalHeight}px`);
}

// PUSH TRAIN TAG TO TRAINS DIRECTIONS
const storeTrain = (train) => {
    TRAINS.push(train);
}

// BUILD AND ADD TRAIN OPTION TO THE DOM
const constructAndAddTrainOption = (tag, parentClass, innerClass, destination) => {
    const container = document.createElement('div');
    container.setAttribute("data-tag", tag);
    container.classList.add(parentClass);
    const trainLink = document.createElement('div');
    trainLink.classList.add(innerClass);
    const trainLinkHeader = document.createElement('h1');
    trainLinkHeader.style.pointerEvents = "none";
    trainLinkHeader.innerHTML = `Train ${tag}`;

    trainLink.appendChild(trainLinkHeader);
    container.appendChild(trainLink);
    DOMDestination = document.querySelector(destination.toString());
    DOMDestination.appendChild(container);
}

// BUILD AND ADD RESULT CONTAINER TO THE DOM
const constructAndAddResultContainer = (name, minutes) => {
    const container = document.createElement('div');
    container.classList.add("result");
    const containerHeader = document.createElement('h1');
    const containerParagraph = document.createElement('p');
    containerHeader.innerHTML = name;
    containerParagraph.innerHTML = `${minutes} minutes`;

    container.appendChild(containerHeader);
    container.appendChild(containerParagraph);
    document.querySelector(".results").appendChild(container);
}

// LOAD TRAINS AND ADD THEIR OPTION TO THE DOM
const loadTrains = async () => {
    const response = await fetch(`${BASE_URL}?command=routeList&a=${AGENCY}`);
    const data = await response.text();
    const ROUTEDATA = GLOBAL_PARSER.parseFromString(data, "application/xml");
    const routes = ROUTEDATA.getElementsByTagName("route");

    return routes
}

// ADD TRAIN OPTIONS
const addTrainOptions = () => {
    loadTrains()
        .then(routes => {
            for (let index = 0; index < routes.length; index++) {
                const route = routes[index];
                const tag = route.getAttribute("tag").toString();
                storeTrain(tag);
                constructAndAddTrainOption(tag, "nav-link", "navlink", "nav");
                constructAndAddTrainOption(tag, "menu-link", "link", ".menu-links-container");
            }
        })
        .then(()=> {
            setClickEventListeners();
        })
        .catch(err => alert(err));
}

// RETURN THE STOPS PER TRAIN GIVEN
const loadStopsFromTrain = async (train) => {
    const response = await fetch(`${BASE_URL}?command=routeConfig&a=${AGENCY}&r=${train}`);
    const data = await response.text();
    return data;
}

// WRAPPER FUNCTION FOR LOADSTOPSPERTRAIN
const getStopsPerTrain = async (train) => {
    var stopsTags = [];
    let stops = [];
    const data = await loadStopsFromTrain(train);
    const STOPSDATA = GLOBAL_PARSER.parseFromString(data, "application/xml");
    const directions = STOPSDATA.getElementsByTagName("direction");
    for (let index = 0; index < directions.length; index++) {
        const direction = directions[index].querySelectorAll('stop');
        for (let iterator = 0; iterator < direction.length; iterator++) {
            const stop = direction[iterator];
            stops.push(stop);
        }
    }
    for (let index = 0; index < stops.length; index++) {
        const element = stops[index];
        stopsTags.push((element.getAttribute("tag")).toString())
    }
    return stopsTags;
}

// GET PREDICTION FROM A GIVEN STOP
const loadPredictionFromStop = async (train, stop) => {
    const res = await fetch(`${BASE_URL}?command=predictions&a=${AGENCY}&r=${train}&s=${stop}&useShortTitles=true`);
    const data = await res.text();
    const PREDICTIONDATA = GLOBAL_PARSER.parseFromString(data, "application/xml");
    let results = [];
    let predictions = PREDICTIONDATA.getElementsByTagName('direction');
    let title = PREDICTIONDATA.querySelector("predictions").getAttribute("stopTitle");
    let timing = []
    for (let index = 0; index < predictions.length; index++) {
        const direction = predictions[index];
        const directionPred = direction.querySelectorAll('prediction');
        timing.push(directionPred);
    }
    for (let index = 0; index < timing.length; index++) {
        const element = timing[index];
        for (let i = 0; i < element.length; i++) {
            const elem = element[i];
            let result_array = [title, elem.getAttribute('minutes')];
            results.push(result_array);
        }
    }
    return results
}

// GET PREDICTIONS FROM STOPS
const getPredictionsFromStops = (train, stops) => {
    for (let index = 0; index < stops.length; index++) {
        const stop = stops[index];
        loadPredictionFromStop(train, stop)
            .then(predictionData => {
                for (let index = 0; index < predictionData.length; index++) {
                    const element = predictionData[index];
                    console.log("reached point of build!");
                    constructAndAddResultContainer(element[0], element[1]);
                }
            })
    }
}

const stopsPerTrain = (train) => {
    getStopsPerTrain(train)
        .then((data) => {
            console.log('got data');
            getPredictionsFromStops(train, data);
        })
}

const setClickEventListeners = () => {
    const trainContainers = document.querySelectorAll(".menu-link");
    const secondTrainContainers = document.querySelectorAll(".nav-link");

    trainContainers.forEach(container => {
        container.addEventListener("click", () => {
            console.log(container.getAttribute('data-tag'));
            document.querySelector(".differfont").textContent = container.getAttribute('data-tag');
            document.querySelector('.results').innerHTML = "";
            stopsPerTrain(container.getAttribute('data-tag'));
        });
    });

    secondTrainContainers.forEach(container => {
        container.addEventListener("click", async () => {
            console.log(container.getAttribute('data-tag'));
            document.querySelector(".differfont").textContent = container.getAttribute('data-tag');
            document.querySelector('.results').innerHTML = "";
            stopsPerTrain(container.getAttribute('data-tag'));
        });
    });
}

// MAIN FUNCTION
function main() {
    setHeightVariable();
    addTrainOptions();
}

// WINDOW LOAD EVENT LISTENER TO RUN THE MAIN FUNCTION
window.addEventListener("load", main);