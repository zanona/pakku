Volo Pack
===

A [volo](https://github.com/volojs/volo) command for packing
a web application to a directory.

### Installation
Install this command via npm into the project's local
`node_modules` directory:

    npm install volo-pack

Then, in the volofile for the project, create a volo command name that
does a require() for this command, and pass it the buildDir and pagesDir to use:

```javascript
//in the volofile
module.exports = {
    //Creates a local project command called `pack`
    pack: require('volo-pack')
}
```

## Usage

While in the project directory, just type:

    volo pack

## License
MIT and new BSD.
