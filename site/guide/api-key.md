# Soloist API key

Soloist needs a **Soloist API key** before it will start. It comes from Spotify's developer
dashboard, but it isn't a Spotify Web API key or client ID. It authorises the Soloist
app. It does **not** log you in to Spotify. That happens later, when you
[pair from the Spotify app](/guide/first-run#pair-with-spotify).

## Getting a key

1. Sign in to the [Spotify for Developers dashboard](https://developer.spotify.com/dashboard)
   with your Spotify account. You need **Spotify Premium**.
2. Follow Spotify's [Soloist documentation](https://developer.spotify.com/documentation/soloist)
   to create the private API key Soloist uses.
3. Copy the key. You'll paste it into Encore's setup page.

## Where it's stored

The key is saved as `soloist.api_key` in `config.yaml` and passed to Soloist as
`--api-key`. The web console hides it after saving. It shows whether a key is set, with
**View** and **Replace** actions.

::: warning
`config.yaml` holds the key in plain text. Keep the `config` folder private, and don't
commit it anywhere.
:::
