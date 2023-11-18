// TESTING VERSION WITH NO BOT

const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Settings
const API_SECRET = process.env.BITQUERY_API_KEY;
const pairedWithAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // WETH, etc
const searchTokenAddress = "0x8390a1DA07E376ef7aDd4Be859BA74Fb83aA02D5"; // WETH, etc
// const maxDaysRange = 365; // search for trades only this max time ago (2_500_000 blocks by default now)
// const blockTime = 12; // seconds
// const nLastBlocks = maxDaysRange * (blockTime * 86400); // calculate the number of blocks

// Prepare GraphQL file
let query = fs.readFileSync('query.graphql', 'utf-8');
query = query.replace('PAIRED_WITH_ADDRESS', pairedWithAddress);
query = query.replace('SEARCH_TOKEN_ADDRESS', searchTokenAddress);

// Query
axios.post('https://streaming.bitquery.io/graphql', {
    query: query,
}, {
    headers: {
        'X-API-KEY': API_SECRET,
    },
})
    .then(response => {
        const dataArray = response.data.data.EVM.DEXTrades;

        // Extracting all "Price" numbers
        const allPrices = dataArray.flatMap(trade => trade.Trade.Buy.Price);

        // Finding the highest price among all "Price" numbers
        const allTimeHighPrice = Math.min(...allPrices);

        // Finding the minimum block number
        const blockNumbers = dataArray.map(trade => parseInt(trade.Block.Number));
        const lowestBlockNumber = Math.min(...blockNumbers);

        // Extracting transactions with the lowest block number
        const transactionsWithLowestBlock = dataArray.filter(trade => parseInt(trade.Block.Number) === lowestBlockNumber);

        // Extracting "Price" numbers from transactions with the lowest block number
        const prices = transactionsWithLowestBlock.map(trade => trade.Trade.Buy.Price);

        // Finding the lowest price among the extracted "Price" numbers
        const firstPrice = Math.max(...prices);

        // Printing the all-time high price
        console.log('ATH:', allTimeHighPrice);

        // Printing the lowest price
        console.log('First price:', firstPrice);

        // Calculate percentage growth difference between first and ATH prices
        const percentageGrowth = (firstPrice / allTimeHighPrice) * 100
        const percentsRounded = percentageGrowth.toFixed(2)

        // Printing the percentage growth difference
        console.log('+' + percentsRounded + '%');
    })
    .catch(error => {
        console.error(error);
    });

// Notes
// ATH value is lowest than starting, because theres a less amount of ETH needed to purchase this token