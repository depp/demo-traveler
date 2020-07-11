# Star Traveler - 1K JavaScript Demo

This is a demo for [JS1024](https://js1024.fun/), July 2020. Final size is 1006 bytes. Tested in Firefox, Chrome, and Safari (desktop).

![Mountain flyby](sample.gif)

See also: [Recording on YouTube](https://www.youtube.com/watch?v=XO-GeD-VRgU)

## How can I run it?

Open the file final/demo.html in your browser.

For now, you can download it from GitHub here: [demo.html](https://raw.githubusercontent.com/depp/demo-traveler/trunk/final/demo.html) (right-click and “save link as”)

## Building

You must first make sure the Git submodule (RegPack) is checked out, and the Yarn dependencies installed.

```shell
$ git submodule init
$ git submodule update
$ yarn install
```

You can build the demo with:

```shell
$ node ./build.mjs build
```

For an auto-reloading development server, run:

```shell
$ node ./build.mjs serve
```

## Recording

You can record the demo using [WSCapture](https://github.com/depp/wscapture).

```shell
$ wscapture
```

Then visit `https://localhost:8080/record.html` to capture a video.
