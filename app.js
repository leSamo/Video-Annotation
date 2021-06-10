const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

// functions to communicate with drive.js file which communicates with Google Drive API
const drive = require('./drive/drive');
const fs = require('fs');

const app = express();
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/public`);

// parse request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// expose /public folder
app.use(express.static(path.join(__dirname, 'public')));

// serve index.html for the user
app.get('/', (req, res) => {
    if (req.query.defaultLabels) {
        req.query.defaultLabels = JSON.parse(req.query.defaultLabels);
    }

    res.render('index', {defaultData: `'${JSON.stringify(req.query)}'`});
});

// serve generator.html for the user
app.get('/generator', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/generator.html'));
});

// list all videos inside Google Drive folder with provided id
app.get('/list', (req, res) => {
    const folderId = req.query.folderId;

    const onDriveReponse = (folderData, error = false, errorMsg) => {
        if (error) {
            res.json({
                error: true,
                errorMsg: errorMsg
            });
        } else { // success
            res.json({
                error: false,
                folderData
            });
        }
    }

    drive.list(onDriveReponse, folderId);
});

app.post('/video', (req, res) => {
    const folderId = req.body.folderId;
    const videoIds = req.body.videoIds;
    const jsonId = req.body.jsonId;
    const videoNames = req.body.videoNames;

    const onDownloadFinished = (videoIds, videoNames, jsonId, error = false, errorMsg) => {
        if (error) {
            res.json({
                error: true,
                errorMsg: errorMsg
            });
        } else { // success
            res.json({
                error: false,
                videoIds,
                videoNames,
                jsonId
            });
        }
    }

    drive.download(onDownloadFinished, folderId, videoIds, videoNames, jsonId);
});

app.get('/videoStatus', (req, res) => {
    const filenames = JSON.parse(decodeURIComponent(req.query.filenames));
    const filepaths = filenames.map(filename => path.join(__dirname + `/public/tmp/${filename}`));

    if (filepaths.every(file => fs.existsSync(file))) {
        res.json({
            all: true
        });
    }
    else {
        res.json({
            all: false
        });
    }
});

app.get('/videoFile', (req, res) => {
    const filepath = path.join(__dirname + `/public/tmp/${req.query.fileId}.${req.query.ext}`);
    res.sendFile(filepath);
});

app.get('/jsonFile', (req, res) => {
    res.sendFile(path.join(__dirname + `/public/tmp/${req.query.fileId}.json`));
});

// user clicked on submit button, upload JSON file to server
app.post('/submit', (req, res) => {
    const data = JSON.parse(req.body.data);
    const onSuccess = () => { res.sendStatus(200); }

    drive.upload(onSuccess, data, req.body.folderId);
});

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server listening on port ${process.env.PORT || 3000}!`)
);