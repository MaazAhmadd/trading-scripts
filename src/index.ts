import {
  APIResponseV3WithTime,
  CategoryV5,
  GetOrderbookParamsV5,
  InstrumentInfoResponseV5,
  LinearInverseInstrumentInfoV5,
  LinearPositionIdx,
  OrderParamsV5,
  OrderSideV5,
  OrderbookLevelV5,
  PositionInfoParamsV5,
  PositionV5,
  RestClientOptions,
  RestClientV5,
  SetLeverageParamsV5,
} from "bybit-api";

import * as fs from "fs";

interface TradeSummary {
  symbol: string;
  side: "Buy" | "Sell";
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
}

const restClientOptions: RestClientOptions = {
  key: "OzERtp8401q8IvaoXf",
  secret: "f71RmLmFKhBBW9oVJt3Qjy4l5ChKejiQU74C",
  parseAPIRateLimits: true,
  demoTrading: true,
};

const client = new RestClientV5(restClientOptions);

//   .then((r) => console.log(JSON.stringify(r, null, 2)));
async function placeTestOrder() {
  const symbol = "1000PEPEUSDT";
  try {
    // Fetch account information
    // const accountInfo = await client.getAccountInfo();
    // console.log("Account Info:", accountInfo);
    const side = getPositionSide();
    await openPosition(5000, symbol, side);
    await delay(60000);
    await closePosition(symbol, side);
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
    // Adjust leverage if required
    if (adjustLeverage > 0) {
      await setLeverage(symbol, adjustLeverage);
    }

    // Fetch the current price for the symbol
    const currentPrice = await fetchCurrentPrice(symbol);
    const {
      lotSizeFilter: { qtyStep },
    } = await getInstrumentInfo(symbol);

    // Calculate the quantity in base coin
    let qty = amountUsdt / currentPrice;

    // Adjust the quantity to meet the qtyStep requirements
    qty = Math.floor(qty / parseFloat(qtyStep)) * parseFloat(qtyStep);
    const qtyString = qty.toFixed(qtyStep.split(".")[1]?.length || 0);

    console.log(`Calculated Quantity: ${qtyString} ${symbol.split("USDT")[0]}`);

    // Place the order
    const orderParams: OrderParamsV5 = {
      category: "linear",
      symbol,
      side,
      orderType: "Market",
      qty: qtyString,
      positionIdx: side == "Buy" ? 1 : 2,
    };
    const orderResponse = await client.submitOrder(orderParams);

    console.log("Order Response:", orderResponse);
    return orderResponse;
  } catch (error) {
    console.error("Error opening position:", error);
    throw error;
  }
}

async function closePosition(symbol: string, side: OrderSideV5): Promise<any> {
  try {
    const oppositeSide: OrderSideV5 = side === "Buy" ? "Sell" : "Buy";
    const position = await getOpenPositionForSide(symbol, side);
    if (position && Number(position.size) > 0) {
      const orderParams: OrderParamsV5 = {
        category: "linear",
        symbol,
        side: oppositeSide,
        orderType: "Market",
        qty: position.size,
        // timeInForce: 'GTC',
        // closeOnTrigger: false,
        // reduceOnly: true, // This ensures the order only reduces the position
        positionIdx: position.positionIdx,
      };
      const orderResponse = await client.submitOrder(orderParams);
      console.log("Close Order Response:", orderResponse);
      return orderResponse;
    } else {
      console.log(`No open ${side} positions found for ${symbol}`);
    }
  } catch (error) {
    console.error("Error closing position:", error);
    throw error;
  }
}

async function getOpenPositionForSide(
  symbol: string,
  side: OrderSideV5
): Promise<PositionV5 | null> {
  try {
    const response = await client.getPositionInfo({
      category: "linear",
      symbol,
    } as PositionInfoParamsV5);
    if (response.retCode !== 0) {
      throw new Error(response.retMsg);
    }
    const positions = response.result.list;
    console.log(
      "Open Positions:",
      positions.find((position) => position.side === "Sell")
    );
    return positions.find((position) => position.side === side) || null;
  } catch (error) {
    console.error("Error fetching open positions:", error);
    throw error;
  }
}

const getInstrumentInfo = async (
  symbol: string
): Promise<LinearInverseInstrumentInfoV5> => {
  let instrumentsInfo = fs.readFileSync("coins.json", { encoding: "utf-8" });
  let parsedInstrumentsInfo = JSON.parse(instrumentsInfo);
  if (parsedInstrumentsInfo[symbol]) {
    let instInfo = parsedInstrumentsInfo[symbol] as APIResponseV3WithTime<
      InstrumentInfoResponseV5<"linear">
    >;
    console.log("got instrument info from fs");
    return instInfo.result.list[0];
  } else {
    const instrumentsInfo = await client.getInstrumentsInfo({
      category: "linear",
      symbol,
    });
    if (instrumentsInfo.result.list.length == 0) {
      throw new Error("invalid symbol");
    }
    parsedInstrumentsInfo[symbol] = instrumentsInfo;
    fs.writeFileSync(
      "coins.json",
      JSON.stringify(parsedInstrumentsInfo, null, 2)
    );
    console.log("got instrument info from server");

    return instrumentsInfo.result.list[0];
  }
};

async function fetchClosedPnL(
  symbol: string,
  count: number
): Promise<TradeSummary[]> {
  try {
    const response = await client.getClosedPnL({
      category: "linear",
      symbol,
      limit: count,
    });

    if (response.retCode !== 0) {
      throw new Error(response.retMsg);
    }

    return response.result.list.map((trade) => ({
      symbol: trade.symbol,
      side: trade.side as "Buy" | "Sell",
      entryPrice: parseFloat(trade.avgEntryPrice),
      exitPrice: parseFloat(trade.avgExitPrice),
      qty: parseFloat(trade.closedSize),
      pnl: parseFloat(trade.closedPnl),
    }));
  } catch (error) {
    console.error("Error fetching closed PnL:", error);
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const interval = 1000; // Update every 1 second
    const totalSteps = ms / interval;
    let currentStep = 0;

    const intervalId = setInterval(() => {
      currentStep++;
      const progress = Math.floor((currentStep / totalSteps) * 50); // Progress bar width
      const bar = "▓".repeat(progress) + "░".repeat(50 - progress);
      process.stdout.write(`\r${bar}`);
      if (currentStep >= totalSteps) {
        clearInterval(intervalId);
        process.stdout.write("\n");
        resolve();
      }
    }, interval);
  });
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

function getPositionSide() {
  let randomNumber = Math.floor(Math.random() * 100) + 1;
  if (randomNumber % 2 === 0) {
    console.log("open LONG");
    return "Buy";
  } else {
    console.log("open SHORT");
    return "Sell";
  }
}

// function countdown(from) {
//   console.log(`countdown: ${from}`);
//   if (from > 0) {
//       setTimeout(() => countdown(from - 1), 1000);
//   } else {
//       console.log('done!');
//   }
// }

// countdown(60);
