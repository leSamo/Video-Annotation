const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { json } = require('body-parser');

// If modifying these scopes, delete token.json, new one will be created upon running npm start and authentificating.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const TOKEN_PATH = 'drive/token.json';

function authAndDownload(callback, folderId, videoIds, videoNames, jsonId) {
    fs.readFile('drive/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);

        authorize(JSON.parse(content), download, callback, { folderId, videoIds, jsonId, videoNames });
    });
}

function authAndUpload(callback, data, folderId) {
    fs.readFile('drive/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);

        authorize(JSON.parse(content), upload, callback, { folderId, data });
    });
}

function authAndList(callback, folderId) {
    fs.readFile('drive/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);

        authorize(JSON.parse(content), list, callback, { folderId });
    });
}

function authorize(credentials, authCallback, actionCallback, data) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, authCallback);
        oAuth2Client.setCredentials(JSON.parse(token));
        authCallback(oAuth2Client, actionCallback, data);
    });
}

function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function downloadFile(drive, fileId, extension) {
    const dest = fs.createWriteStream(`public/tmp/${fileId}.${extension}.dl`);

    return new Promise(function(resolve, reject) {
        drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'stream' })
            .then(res => {
                res.data
                    .on('end', () => {
                        // rename file
                        fs.renameSync(`public/tmp/${fileId}.${extension}.dl`, `public/tmp/${fileId}.${extension}`);
                        resolve();
                    })
                    .on('error', err => {
                        reject();
                    })
                    .pipe(dest);
            }, err => {
                console.error(err);
                reject();
            });
    });
}

function uploadFile(drive, folderId, filename, content) {
    return new Promise(function(resolve, reject) {
        drive.files.create({
            requestBody: {
                name: filename,
                parents: [folderId]
            },
            media: {
                body: JSON.stringify(content, null, 4)
            }
        }).then(res => resolve()); 
    });
}

function updateFile(drive, fileId, content) {
    return new Promise(function(resolve, reject) {
        drive.files.update({
            fileId,
            media: {
                body: JSON.stringify(content, null, 4)
            }
        }).then(res => resolve()); 
    });
}

function download(auth, callback, { folderId, videoIds, jsonId, videoNames }) {
    const drive = google.drive({ version: 'v3', auth });

    if (!fs.existsSync("public/tmp")) {
        fs.mkdirSync("public/tmp");
    }

    videoIds = JSON.parse(videoIds);
    videoNames = JSON.parse(videoNames);

    if (jsonId) {
        downloadFile(drive, jsonId, "json").then(() => {
            callback(videoIds, videoNames, jsonId);
        });
    }
    else {
        callback(videoIds, videoNames);
    }

    Promise.all(videoIds.map((video, index) => downloadFile(drive, video, videoNames[index].split(".").pop()))).then(() => {
        console.log("All videos downloaded successfully.");
    });
}

function upload(auth, callback, { folderId, data }) {
    const drive = google.drive({ version: 'v3', auth });

    drive.files.list({
        pageSize: 500,
        fields: 'nextPageToken, files(id, name)',
        q: `'${folderId}' in parents and trashed = false`
    }, (err, res) => {
        if (err) console.log("err:", err);
        if (res === undefined) {
            callback(null, true, "There was a problem uploading JSON file.");
            return;
        }

        const fileList = res.data.files;

        data = data.map(fileToUpload => ({...fileToUpload, existingFile: fileList.find(existingFile => existingFile.name === fileToUpload.name + ".json")?.id }));

        Promise.all(data.map(jsonFile => {
            if (jsonFile.existingFile) {
                updateFile(drive, jsonFile.existingFile, jsonFile.data);
            }
            else {
                uploadFile(drive, folderId, jsonFile.name + ".json", jsonFile.data);
            }
        })).then(() => {
            callback();
        });
    });
}

function list(auth, callback, { folderId }) {
    const drive = google.drive({ version: 'v3', auth });

    drive.files.list({
        pageSize: 500,
        fields: 'nextPageToken, files(id, name)',
        q: `'${folderId}' in parents and trashed = false`,
        orderBy: 'name'
    }, (err, res) => {
        if (err) console.log("err:", err);
        if (res === undefined) {
            callback(null, false, true, "Invalid or no folder ID, please use 'New folder' button to enter a new ID.");
            return;
        }

        const fileList = res.data.files;

        callback(fileList, false);
    });
}


// Expose functions for app.js
exports.download = authAndDownload;
exports.upload = authAndUpload;
exports.list = authAndList;