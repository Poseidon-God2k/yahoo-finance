const express = require("express");

const BB = require("technicalindicators").BollingerBands;
const axios = require("axios");
const app = express();
const moment = require("moment");
var cors = require("cors");
app.use(express.json());
app.use(cors());

const getData = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};
const handleData = async (type, interval) => {
  const period2 = parseInt(Date.now() / 1000);
  let period1;

  switch (interval) {
    case "1m":
    case "2m":
      period1 = period2 - 172800;
      break;
    case "5m":
      period1 = period2 - 518400;
      break;
    case "15m":
      period1 = period2 - 1296000;
      break;
    case "1d":
      period1 = period2 - 165456000;
    case "1w":
    case "1m":
      period1 = period2 - 160876800;
      interval = "1d";
      break;
  }

  //time format MM-DD-YYYY:HHMMSS
  let url = `https://query1.finance.yahoo.com/v8/finance/chart/${type}?symbol=${type}&period1=${period1}&period2=${period2}&useYfid=true&interval=${interval}&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US&crumb=JAJDfC9%2F4A.&corsDomain=finance.yahoo.com`;
  if (interval === "60m" || interval === "4h") {
    url = `https://query1.finance.yahoo.com/v8/finance/chart/${type}?symbol=${type}&range=6mo&useYfid=true&interval=60m&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US&crumb=1zVdVRLIadN&corsDomain=finance.yahoo.com`;
  }
  let data;
  try {
    data = await getData(url);
  } catch (error) {
    console.log("Cant get data");
  }

  if (!data || !data.chart || data.chart?.length === 0)
    return {
      BB1: {
        lower: 0,
        middle: 0,
        upper: 0,
      },
      BB2: {
        lower: 0,
        middle: 0,
        upper: 0,
      },
      BB3: {
        lower: 0,
        middle: 0,
        upper: 0,
      },
      currentPrice: 0,
      time: moment(period2 * 1000).format("MM-DD-YYYY:HHmmss"),
    };
  const values = data.chart.result[0].indicators.quote[0].close.filter((item) => item).slice(-20);

  const time = moment(period2 * 1000).format("MM-DD-YYYY:HHmmss");
  const period = 20;

  const input1 = {
    period: period,
    values: values,
    stdDev: 1,
  };

  const input2 = {
    period: period,
    values: values,
    stdDev: 2,
  };

  const input3 = {
    period: period,
    values: values,
    stdDev: 3,
  };

  const [BB1] = BB.calculate(input1);
  const [BB2] = BB.calculate(input2);
  const [BB3] = BB.calculate(input3);
  return { BB1, BB2, BB3, currentPrice: values[values.length - 1], time };
};

app.get("/chart", async (req, res) => {
  const { type, interval } = req.query;

  const data = await handleData(type, interval);
  res.status(200).json(data);
});

app.listen(8111, () => {
  console.log("Server is running on port 8111");
});
