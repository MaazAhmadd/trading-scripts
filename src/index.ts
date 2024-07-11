import {
  GetOrderbookParamsV5,
  LinearPositionIdx,
  OrderParamsV5,
  OrderSideV5,
  OrderbookLevelV5,
  RestClientOptions,
  RestClientV5,
  SetLeverageParamsV5,
} from "bybit-api";

import * as fs from "fs";

const restClientOptions: RestClientOptions = {
  key: "OzERtp8401q8IvaoXf",
  secret: "f71RmLmFKhBBW9oVJt3Qjy4l5ChKejiQU74C",
  parseAPIRateLimits: true,
  demoTrading: true,
};

const client = new RestClientV5(restClientOptions);

async function placeTestOrder() {
  try {
    // Fetch account information
    const accountInfo = await client.getAccountInfo();
    console.log("Account Info:", accountInfo);

    // const instrumentsInfo = await client.getInstrumentsInfo({
    //   category: "linear",
    //   symbol: "BTCUSDT",
    // });

    // console.log("Instruments Info:", instrumentsInfo);
    // save intrument info to json file:
    // fs.writeFileSync("BTCUSDT.json", JSON.stringify(instrumentsInfo, null, 2));
    "0.1".split(".")[1] && "0.1".split(".")[1].length==1
    await openPosition(5000, "BTCUSDT", "Buy", 20);
  } catch (error) {
    console.error("Error placing test order:", error);
  }
}

async function openPosition(
  amountUsdt: number,
  symbol: string,
  side: OrderSideV5,
  adjustLeverage: number = 0
): Promise<any> {
  try {
    // Validate parameters
    if (amountUsdt <= 0) {
      throw new Error("Amount in USDT must be greater than zero.");
    }
    if (!symbol) {
      throw new Error("Symbol must be provided.");
    }
    if (!side) {
      throw new Error("Side must be provided.");
}                                                                                                                                                                                             

    // Adjust leverage if required
    if (adjustLeverage > 0) {
      await setLeverage(symbol, adjustLeverage);
    }

    // Fetch the current price for the symbol
    const currentPrice = await fetchCurrentPrice(symbol);

    // Calculate the quantity in base coin
    const                                                                                                                                                                                                                                                                                           qty = String((amountUsdt / currentPrice).toFixed(3));
    console.log(`Calculated Quantity: ${qty} ${symbol.split("USDT")[0]}`);

    // Place the order
    const orderParams: OrderParamsV5 = {
      category: "linear",
      symbol: "BTCUSDT",
      side: "Buy",
      orderType: "Market",
      marketUnit: "quoteCoin",
      qty:"5000",
    };
    const orderResponse = await client.submitOrder(orderParams);

    console.log("Order Response:", orderResponse);
    return orderResponse;
  } catch (error) {
    console.error("Error opening position:", error);
    throw error;
  }
}

// Helper functions (setLeverage and fetchCurrentPrice) should be defined elsewhere in your code

async function setLeverage(symbol: string, leverage: number) {
  try {
    const response = await client.setLeverage({
      category: "linear",
      symbol,
      buyLeverage: String(leverage),
      sellLeverage: String(leverage),
    });
    console.log("Set Leverage Response:", response);
  } catch (error) {
    console.error("Error setting leverage:", error);
    throw error;
  }
}

async function fetchCurrentPrice(symbol: string): Promise<number> {
  try {
    const orderBook = await client.getOrderbook({ category: "linear", symbol });
    const topAsk = orderBook.result.a[0];
    const currentPrice = parseFloat(topAsk[0]);
    console.log(`Current Price for ${symbol}: ${currentPrice}`);
    return currentPrice;
  } catch (error) {
    console.error("Error fetching order book:", error);
    throw error;
  }
}

// Place a test order and start countdown
placeTestOrder();

// api key mainnet readonly
// eVQpJFthmqqrqy2WNM
// api secret mainnet readonly
// 9RORXmo9sBzwlOhIrnLGHJmpjFqrYL2UQL5g

// api key demo trading
// OzERtp8401q8IvaoXf
// api secret demo trading
// f71RmLmFKhBBW9oVJt3Qjy4l5ChKejiQU74C

// api key testnet
// MqjZPCrDLJcR3DA3d6
// api secret testnet
// jf20rbP7sPtVQNl1o1EroYhvxFgXyCb6Xgqs

// function getRandomNumber() {
//   return Math.floor(Math.random() * 100) + 1;
// }

// function countdown(from) {
//   console.log(`countdown: ${from}`);
//   if (from > 0) {
//       setTimeout(() => countdown(from - 1), 1000);
//   } else {
//       console.log('done!');
//   }
// }

// const randomNumber = getRandomNumber();
// if (randomNumber % 2 === 0) {
//   console.log("open LONG");
// } else {
//   console.log("open SHORT");
// }
// countdown(60);
