# qsHighlightMap

## Intro

A Qlik Sense extension map which highlights the extremes in your data – so far max and min values in current data selection.

This is also a proof of concept that you can write Qlik Sense extensions with EcmaScript 2015 and later :)

<img src="./src/img/qsmap-showcase.gif" width="800" />


## Install

1. Download/Clone the project and put it your Qlik Sense Extensions directory, e.g. located here: `/Users/<username>/Qlik/Sense/Extensions/`
2. Make sure you have installed node/npm, otherwise do so from here: https://nodejs.org/en/download/
3. Enter your console and change directory to the project root folder `qsHighlightMap`: `cd qsHighlightMap`
4. Build the code by running these commands in your console/terminal: `npm install && npm run build` (on Windows `npm install & npm run build`)
5. The built code ends up in the `dist` folder
6. Reload your sense application and in edit mode you should see the extension appear in the extensions panel

## Usage

- Requires geographic point data in your Qlik Sense app. Create this by for instance by uploading a sheet with city names: https://community.qlik.com/docs/DOC-6941

## Limitations

- Works only with point data
- Does not work with Storytelling

## License

MIT License

## Support

Feel free to report bugs or come with suggestions etc.