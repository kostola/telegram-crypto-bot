const TelegramBot = require('node-telegram-bot-api');
const RestClient = require('node-rest-client').Client;

const token = process.env.TELEGRAM_BOT_TOKEN;

const client = new RestClient();
const bot = new TelegramBot(token, {polling: true});

function pad(input) {
    return parseFloat(input).toFixed(2).padStart(8);
}

function coinMessage(coin) {
    var msg = '';
    msg += `\`*** ${coin.name} ***\n`;
    msg += `Cur. price: ${pad(coin.price_eur)}€\n`;
    msg += ` 1h change: ${pad(coin.percent_change_1h)}%\n`;
    msg += `24h change: ${pad(coin.percent_change_24h)}%\n`;
    msg += ` 7d change: ${pad(coin.percent_change_7d)}%\`\n\n`;
    msg += `[Open in CoinMarketCap](https://coinmarketcap.com/currencies/${coin.id}/)`;
    return msg;
}

console.log("Initializing coin symbols...");

client.get("https://api.coinmarketcap.com/v1/ticker/?limit=0", (data, response) => {
    if(response.statusCode !== 200) {
        console.log('Error when retrieving list of coin symbols');
        process.exit(1);
    }

    const coinsMap = new Map(data.map((e) => [e.symbol.toLowerCase(), e.id]));
    console.log(`Retrieved ${coinsMap.size} coin symbols`);
    console.log("Launching bot...");

    bot.onText(/\/ticker ([^ ]+).*/, (msg, match) => {
        const input = match[1];
        const inputLower = input.toLowerCase();
        const tickerId = coinsMap.has(inputLower) ? coinsMap.get(inputLower) : inputLower;
        const chatId = msg.chat.id;

        console.log(`Received ticker request from chat ${chatId} for: ${input}`);

        client.get("https://api.coinmarketcap.com/v1/ticker/" + tickerId + "/?convert=EUR", (coinData, coinResponse) => {
            if(coinResponse.statusCode !== 200) {
                bot.sendMessage(chatId, "Unknown coin *" + input + "*", { parse_mode: 'Markdown', disable_web_page_preview: true });
            } else {
                const coin = coinData[0];
                bot.sendMessage(chatId, coinMessage(coin), { parse_mode: 'Markdown', disable_web_page_preview: true });
            }
        });    
    });
});
