const express = require('express');
const app = express();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const redis = require('redis');
const path = require("path");
const Bottleneck = require('bottleneck');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const client = redis.createClient(REDIS_PORT);

const static_path = path.join(__dirname, "../public");

app.use(express.json());
app.use(express.static(static_path));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// const hbs = require("hbs");
// const view_path = path.join(__dirname, "../templates/views");
// const partials_path = path.join(__dirname, "../templates/partials");

// app.set("view engine", "hbs");
// app.set("views", view_path);
// hbs.registerPartials(partials_path);
// import Bottleneck from "bottleneck";

//weather key an url
const config = {
  wURL: "https://api.openweathermap.org/data/2.5/",
  wKey: "291e49940a62ae68120d245089422d0e",
};

//Reservoir Intervals:Refresh Interval
const limiter = new Bottleneck({
  reservoir: 20, // initial value
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 60 * 1000, // must be divisible by 250

  maxConcurrent: 1,
  minTime: 500,
});

//call if cache is miss 
const getWeather = async (req, res) => {
  const { cityName, ccode, scode, unit } = req.body;
  const apiEndPoint = `${config.wURL
    }weather?q=${cityName},${scode.toLowerCase()},${ccode.toLowerCase()}&APPID=${config.wKey
    }&units=${unit}`;
  try {
    limiter
      .schedule(() => {          // schedule() returns a promise that will be executed according to the rate limits.
        return fetch(apiEndPoint);
      })
      .then(async (response) => {
        //   console.log(response);
        if (response.status != 200) {
          if (response.status == 404) {
            err = `<div class="alert-danger">
                <h3>Oops!! No data available</h3></div>`;
            return res.json({ err });
          } else {
            throw new Error(
              `Something went wrong, status code: ${response.status}`
            );
          }
        }
        const weather = await response.json();

        // Set data to Redis
        const key = cityName + ccode + scode + unit;
        client.setex(key, 3600, JSON.stringify(weather));

        return res.json(weather);
      });
  } catch (error) {
    console.log(error);
  }
};
//store count of new request
let newRequestCount = 0;

//call automatically after 1 minute
setInterval(async () => {
  newRequestCount = 0;
}, 60 * 1000);

// Cache middleware
function cache(req, res, next) {
  const { cityName, ccode, scode, unit } = req.body;
  const key = cityName + ccode + scode + unit;

  client.get(key, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      return res.json(JSON.parse(data)); // cache is hit
    } else {
      if (newRequestCount <= 40) {
        newRequestCount++;  //cache is miss
        console.log(newRequestCount);
        next();
      } else {         //new request exceed 40
        console.log(`hello tushar`);
        return res.json({
          err: `<div class="alert-danger">
        <h3>Oops!! Server is busy Try again later </h3></div>`,
        });
      }
    }
  });
}

//post request to api
app.post("/getWeather", cache, getWeather);

app.listen(5000, () => {
  console.log(`App listening on port ${PORT}`);
});