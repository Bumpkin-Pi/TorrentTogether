const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const bodyParser = require('body-parser');
const express = require("express");
const torrentStream = require("torrent-stream");
const pump = require("pump");
const rangeParser = require("range-parser");
class videoServer{
    magnet = "";
    engine = null;
    file = null;
    app = null;
    port = 3000;

    constructor() {
        this.app = express();
        this.app.use(bodyParser.json());
    };

    async StartListener(){
        this.app.post("/submit-magnet", (req, res) => {
            console.log("/submit-magnet attempt")
            console.log(req.body);
            this.magnet = req.body.magnet;
            console.log("Loading: " + this.magnet);

            this.StartVideo(res);
        });
        this.app.get("/magnet", (req, res) => {
            res.send(this.magnet);
        })

        this.app.listen(this.port, () => {
            console.log(`Video Server listening at http://localhost:${this.port}`)
        })
    }

    async StartVideo(listenerRes){ // Start torrent and express server
        this.engine = await torrentStream(this.magnet);
        await this.engine.on("ready", () => {
            listenerRes.json({ success: true }); // "Janky" you say? fake news.
            this.file = this.engine.files.reduce(function (a,b) {return a.length > b.length ? a : b}); // Get the biggest file.
            console.log("Hosting: "+this.file.name);

            this.app.get("/video.mp4*", (req, res) => {
                let range = req.headers.range;
                range = range && rangeParser(this.file.length, range)[0];
                res.setHeader('Accept-Ranges', 'bytes');
                res.type(this.file.name);
                // req.connection.setTimeout(3600000);

                if (!range) {
                    res.setHeader('Content-Length', this.file.length);
                    if (req.method === 'HEAD') {
                        return res.end();
                    }
                    return pump(this.file.createReadStream(), res);
                }

                res.statusCode = 206;
                res.setHeader('Content-Length', range.end - range.start + 1);
                res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + this.file.length);
                if (req.method === 'HEAD') {
                    return res.end();
                }
                pump(this.file.createReadStream(range),res);
            })
        })


    }
}

let mainWindow;
let server = new videoServer();
server.StartListener(); // Hope that this doesnt have any issues.

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false // Allow loading resources from other domains
        }
    });

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'public', 'index.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    mainWindow.setMenu(null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
