# LED CLock

To be run on a Raspberry Pi with a ws2812 LED matrix.

This is still a major WIP.

# Usage

## Raspberry Pi

On a Pi do the following:

```bash
git clone https://github.com/electrovir/led-clock.git
# This next command requires sudo access and your password. This is needed in order to draw to the LED matrix.
# The sudo permissions are scoped as much as possible to avoid unnecessary security vulnerabiltiies.
./startup.sh
```

Some other setup might be necessary for this to work due to the underlying usage of [rpi_ws281x](https://github.com/jgarff/rpi_ws281x). I don't remember what this setup is anymore but I will update this once I figure it out again.

## Other computer

On another computer on your network, run the following. Make sure to replace `<IP-ADDRESS-OF-PI-HERE>` with your Raspberry Pi's IP address.

```bash
curl -v <IP-ADDRESS-OF-PI-HERE>:8001/data/'\{"type":"custom-text","submitterName":"test","text":"Hello%20there","color":"BLACK"\}'
```

Note that the `color` property in the above `curl` command currently doesn't do anything.
