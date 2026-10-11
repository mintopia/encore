# Pusher & Laravel Reverb

With **Pusher protocol** turned on, the [relay](/advanced/relay) speaks the Pusher
WebSocket protocol. That means it can connect straight to a Pusher-compatible server such as
[Laravel Reverb](https://reverb.laravel.com), Soketi or Pusher Channels, and your app's
front end can listen with Laravel Echo or pusher-js like any other channel.

## Setup

1. Set **Relay URL** to your server's app WebSocket URL, for example
   `wss://reverb.example.com/app/<REVERB_APP_KEY>`.
2. Turn on **Pusher protocol**.
3. Set **Channel**, for example `private-soloist`.
4. For `private-` or `presence-` channels, enter the **App key** and **App secret**. Encore
   signs the subscription itself, so no auth endpoint is needed.

::: warning Use a private channel
On a public channel, anyone who knows the channel name can send commands to Soloist. Use a
`private-` channel with the app key and secret.
:::

## Message format

**Outgoing.** Each Soloist frame is sent as a client event on the channel, named after the
frame's `type`, with the whole frame as `data`:

```json
{ "event": "client-track_changed", "channel": "private-soloist", "data": { "type": "track_changed", "...": "..." } }
```

Pusher servers only rebroadcast client events named `client-*`. Reverb also only accepts
them from a connection subscribed to the channel, which Encore always is.

**Incoming.** Any non-protocol event on the channel has its `data` unwrapped and sent to
Soloist as a command. Send it with a client event (a "whisper" in Echo) or broadcast from
your server.

## Laravel Echo example

```js
Echo.private('soloist')
  .listenForWhisper('track_changed', (track) => {
    console.log('Now playing', track);
  });
```

`listenForWhisper('x')` listens for `client-x`, which is the event name Encore sends.

## Reverb configuration

Client events need to be allowed for the app. In `config/reverb.php`, check the app's
`accept_client_events_from` setting allows members (the default) or all.

```yaml
relay:
  url: "wss://reverb.example.com/app/REVERB_APP_KEY"
  pusher: true
  channel: "private-soloist"
  app_key: "REVERB_APP_KEY"
  app_secret: "REVERB_APP_SECRET"
```
