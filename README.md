# BTC2FIAT

No-BS BTC to USD converter hosted at [btc2fiat.me](https://btc2fiat.me), a lighteight (less than 30 KB) converter developed for Bitcoin enthusiasts and digital minimalists, out of frustration of how much noise surrounds most of the Bitcoin space.

![B2F](https://user-images.githubusercontent.com/100208905/163191012-91e73714-7f0e-4f5d-83bf-4262df1de1fa.png)

__BTC/USD conversion powered by [Coingecko API](https://www.coingecko.com/en/api).__

Simple and fast-loading services are especially important when connections are slow (for example while using TOR), slower VPNs, or in regions where internet access is limited.

## Running it on your own

Simply upload all files to a folder to any web hosting provider, access the folder or the `index.html` file and the exchange should work.

You will need an internet connection to fetch the BTC/USD exchange from Coingecko.

## License
See [LICENSE](LICENSE).

Except for the B2F logo and BIT2FIAT, the rest of the source code is AGPL v3.0.

The license template is based from [mempool.space's license](https://github.com/mempool/mempool/blob/master/LICENSE) but in no way is it implied that it is related in any way.

## A note on privacy

We don't collect any cookies or send any network requests to any server other than Coingecko API through the request URL:

https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin

While it is unknown what they could do with the information you share (such as your IP), the API is only used to retrieve how much is 1 BTC in terms of USD. The amount of the conversion itself (eg: `300 usd`) is not sent to the Coingecko servers.

The same goes for the statistics that are logged on the `btc2fiat.me` server such as user agent and location.
