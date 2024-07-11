import {
  OrderParamsV5,
  RestClientOptions,
  RestClientV5,
  SetLeverageParamsV5,
} from "bybit-api";

const restClientOptions: RestClientOptions = {
  key: "OzERtp8401q8IvaoXf",
  secret: "f71RmLmFKhBBW9oVJt3Qjy4l5ChKejiQU74C",
  parseAPIRateLimits: true,
  demoTrading: true,
};

const client = new RestClientV5(restClientOptions);

async function setLeverage(symbol: string, leverage: number) {
  try {
    const response = await client.setLeverage({
      category: "linear", // or 'inverse', depending on the market
      symbol,
      buyLeverage: String(leverage),
      sellLeverage: String(leverage),
    } as SetLeverageParamsV5);
    console.log("Set Leverage Response:", response);
  } catch (error) {
    console.error("Error setting leverage:", error);
  }
}
async function placeTestOrder() {
  try {
    // Fetch account information
    const accountInfo = await client.getAccountInfo();
    console.log("Account Info:", accountInfo);
    await setLeverage("ETHUSDT", 50);
    // Adjusted quantity to be within limits
    const adjustedQty = "1"; // Adjust this quantity based on your available margin and leverage

    // Place a test order
    const order = await client.submitOrder({
      category: "linear",
      symbol: "ETHUSDT",
      side: "Buy",
      orderType: "Market",
      qty: adjustedQty,
      timeInForce: "GTC",
      reduceOnly: false,
      closeOnTrigger: false,
      isLeverage: 1,
      marketUnit: "baseCoin",
      positionIdx: 1,
    } as OrderParamsV5);

    console.log("Test Order Response:", order);
  } catch (error) {
    console.error("Error placing test order:", error);
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
