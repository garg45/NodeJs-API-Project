const config = {
    cURL: "https://api.countrystatecity.in/v1/countries",
    cKey: "c0lJT1JOSjkwNHdPT25aUGlBazZUejhLeENFTTZxd01yZWRUcFNoUg==",
    wURL: "https://api.openweathermap.org/data/2.5/",
    wKey: "291e49940a62ae68120d245089422d0e",
};

//get countries
const getCountries = async (fieldName, ...args) => {
    let apiEndPoint;
    switch (fieldName) {
        case "country":
            apiEndPoint = config.cURL;
            break;
        case "state":
            apiEndPoint = `${config.cURL}/${args[0]}/states`;
            break;
        case "city":
            apiEndPoint = `${config.cURL}/${args[0]}/states/${args[1]}/cities`;
            break;
        default:
    }
    const response = await fetch(apiEndPoint, {
        headers: { "X-CSCAPI-KEY": config.cKey },
    });
    if (response.status != 200) {
        throw new Error(`Something went wrong, status code: ${response.status}`);
    }
    const countries = await response.json();
    return countries;
};

//get weather info
const getWeather = async (cityName, ccode, scode, unit = "metric") => {
    const res = await fetch("/getWeather", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            cityName,
            ccode,
            scode,
            unit,
        }),
    });
    return await res.json();
};

const getDateTime = (unixTimeStamp) => {
    const milliSeconds = unixTimeStamp * 1000;
    const dateObject = new Date(milliSeconds);
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    const humanDateFormat = dateObject.toLocaleDateString("en-US", options);
    return humanDateFormat;
};

const tempCard = (val, unit = "cel") => {
    const flag = unit == "far" ? "°F" : "°C";
    return `<h6 class="card-subtitle mb-2 ${unit}">${val.temp}</h6>
      <p class="card-text">Feels Like: ${val.feels_like} ${flag}</p>
      <p class="card-text">Max: ${val.temp_max} ${flag}, Min: ${val.temp_min} ${flag}</p>`;
};


const displayWeather = (data) => {
    console.log(data);
    const wheatherWidget = `<div class="card">
          <div class="card-body">
              <h5 class="card-title">
                  ${data.name}, ${data.sys.country}
                  <span class="float-end units"><a href="#" data-unit="cel" class="unitlink active">°C</a> | <a href="#" data-unit="far" class="unitlink">°F</a></span>
              </h5>
              <p>${getDateTime(data.dt)}</p>
              <div id="temp-card">
                  ${tempCard(data.main)}
              </div>
              ${data.weather
            .map(
                (
                    w
                ) => `<div id="img-container">${w.main} <img src="https://openweathermap.org/img/wn/${w.icon}.png" ></div>
              <p>${w.description}</p>`
            )
            .join("\n")}
          </div>
      </div>`;
    weatherDiv.innerHTML = wheatherWidget;
};

const getLoader = () => {
    return `<div class="spinner-grow text-info" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>`;
};

const countryListDropDown = document.querySelector("#countryList");
const stateListDropDown = document.querySelector("#stateList");
const cityListDropDown = document.querySelector("#cityList");
const weatherDiv = document.querySelector("#weather-widget");

//On content load
document.addEventListener("DOMContentLoaded", async () => {
    const countries = await getCountries("country");
    let countriesOption = "";
    if (countries) {
        countriesOption += `<option value="">Country</option>`;
        countries.forEach((country) => {
            countriesOption += `<option value="${country.iso2}">${country.name}</option>`;
        });
        countryListDropDown.innerHTML = countriesOption;
    }

    //List States
    countryListDropDown.addEventListener("change", async function () {
        const selectedCountryCode = this.value;
        // console.log("selected Country Code"+selectedCountryCode);
        const states = await getCountries("state", selectedCountryCode);
        // console.log(states);
        let statesOption = "";
        if (states) {
            stateListDropDown.disabled = false;
            statesOption += `<option value="">States</option>`;
            states.forEach((state) => {
                statesOption += `<option value="${state.iso2}">${state.name}</option>`;
            });
            stateListDropDown.innerHTML = statesOption;
        }
    });

    //List Cities
    stateListDropDown.addEventListener("change", async function () {
        const selectedCountryCode = countryListDropDown.value;
        const selectedStateCode = this.value;
        // console.log("selected State Code"+selectedStateCode);
        const cities = await getCountries(
            "city",
            selectedCountryCode,
            selectedStateCode
        );
        // console.log(cities);
        let citiesOption = "";
        if (cities) {
            cityListDropDown.disabled = false;
            citiesOption += `<option value="">Cities</option>`;
            cities.forEach((city) => {
                citiesOption += `<option value="${city.name}">${city.name}</option>`;
            });
            cityListDropDown.innerHTML = citiesOption;
        }
    });

    //select city
    cityListDropDown.addEventListener("change", async function () {
        const selectedCity = this.value;
        const selectedCountryCode = countryListDropDown.value;
        const selectedStateCode = stateListDropDown.value;
        weatherDiv.innerHTML = getLoader();
        const weatherInfo = await getWeather(
            selectedCity,
            selectedCountryCode,
            selectedStateCode
        );
        // console.log(weatherInfo.err);
        if (weatherInfo.err) {
            weatherDiv.innerHTML = weatherInfo.err;
        } else displayWeather(weatherInfo);
    });

    //change unit
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("unitlink")) {
            const unitValue = e.target.getAttribute("data-unit");
            const selectedCountryCode = countryListDropDown.value;
            const selectedStateCode = stateListDropDown.value;
            const selectedCity = cityListDropDown.value;
            const unitFlag = unitValue == "far" ? "imperial" : "metric";
            const weatherInfo = await getWeather(
                selectedCity,
                selectedCountryCode,
                selectedStateCode,
                unitFlag
            );
            if (weatherInfo.err) {
                weatherDiv.innerHTML = err;
            } else {
                const weatherTemp = tempCard(weatherInfo.main, unitValue);
                document.querySelector("#temp-card").innerHTML = weatherTemp;

                //active unit
                document.querySelectorAll(".unitlink").forEach((link) => {
                    link.classList.remove("active");
                });

                e.target.classList.add("active");
            }
        }
    });
});