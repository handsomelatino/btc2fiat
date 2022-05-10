# BTC2FIAT

No BS, clean, and simple BTC to Fiat converter hosted at [btc2fiat.me](https://btc2fiat.me). Open source, lightweight (< 50 KB plain HTML and vanilla Javascript) converter developed for Bitcoin enthusiasts and digital minimalists, built out of frustration of how much noise surrounds most of the Bitcoin space.

![B2F](https://user-images.githubusercontent.com/100208905/163191012-91e73714-7f0e-4f5d-83bf-4262df1de1fa.png)

__BTC/USD conversion powered by [Coingecko API](https://www.coingecko.com/en/api).__

Many online converters show irrelevant news, ads, affiliate website, or are hosted in exchanges.

Paraphrasing [Cal Newport](https://www.calnewport.com/), _in an increasingly distracted world, finding focus becomes rare and valuable_.

## Running it on your own

Download this repository (ZIP file can be downloaded from Github) and upload all files to any web hosting provider.

You will need an internet connection to fetch the BTC/USD exchange from Coingecko. Their API request requires no API authentication with an excellent rate limit.

## License
See [LICENSE](LICENSE).

Except for the B2F logo and BIT2FIAT, the rest of the source code is AGPL v3.0.

The license template is ~~ripped~~ based on [mempool.space's license](https://github.com/mempool/mempool/blob/master/LICENSE) but in no way is it implied that both are related anyhow.

## Contributing
Feel free to submit any bugs or suggestions, PR's are open but I am still refactoring some parts of the code and there might be drastic changes without previous notice.

The following features are being thought / worked on:

- Multiple fiat currencies (for now the rationale is that this converter is centered around the world's leading cryptocurrency vs. the world's leading fiat currencies).

- Toggle between light and dark mode.

- Cache the value from coingecko into the server and figure out what is a good time frame, perhaps 1 minute.

## A note on privacy

We don't collect any cookies or send any network requests to any server other than Coingecko API through the request URL:

https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin

While it is unknown what they could do with the information you share (such as your IP), the API is only used to retrieve how much is 1 BTC in terms of USD. The amount of the conversion itself (eg: `300 usd`) is not sent to the Coingecko servers.

The same goes for the statistics that are logged on the `btc2fiat.me` server such as user agent and location.

When using TOR, occasionally the GET response from coingecko will fail, probably related to their firewall or rate limit. I have seen this happen, but fortunately not too often.