# Video Annotation

## App is available online at http://video-anno.herokuapp.com/.

# Table of contents
1.	[Description](#description)  
    a. [Browser compatibility](#browser-compatibility)  
    b. [Input video data setup](#input-video-data-setup)  
    c. [Usage](#usage)  
    d. [Selecting videos](#selecting-videos)  
    e. [Syncing multiple videos](#syncing-multiple-videos)  
    f. [Video playback](#video-playback)  
    g. [Annotating data](#annotating-data)  
2.	[Labels JSON format](#labels-json-format)  
    b. [Simple list of labels](#simple-list-of-labels)  
    c. [Labels split into categories](#labels-split-into-categories)  
3. [Keyboard shortcuts](#keyboard-shortcuts)  
    a. [Video playback shortcuts](#video-playback-shortcuts)  
    b. [Annotation shortcuts](#annotation-shortcuts)  
4. [Output file format](#output-file-format)  
    a. [Example](#example)
5. [Link generator](#link-generator) 
6. [Local setup](#local-setup)  
    a. [First time setup](#first-time-setup)  
    b. [Run server](#run-server)  
7. [Program documentation](#program-documentation)  
    a. [Package dependencies](#package-dependencies)  
    b. [Client-side libraries](#client-side-libraries)  
    c. [File structure](#file-structure)
    d. [API enpoints](#api-endpoints)  
    e. [Client-server communication](#client-server-communication)  
8. [Used libraries](#used-libraries)  

# Description
Video annotation tool for machine learning, capable of importing videos and exporting annotations in JSON format to Google Drive. App is built in Node.js on Express framework. It uses Google API to communicate with Google Drive. App is available online at http://video-anno.herokuapp.com/. In case you want to set up the app locally, follow instructions in [local setup chapter](#local-setup) below.

## Browser compatibility
- Chrome (tested on version 87)
- Firefox (tested on version 83)
- Edge (tested on version 87)

Your browser must also support format of the video you are annotating, see [HTML5 video support](https://videojs.com/html5-video-support/).

## Input video data setup
Before using the app, you need to set up a Google Drive folder with the videos to annotate.
1. Create a new folder inside your own [Google Drive](https://drive.google.com/)
2. Put all dataset videos in the folder (supported video extensions are `mp4, mov, mkv, wmv, flv, avi, webm, mpg, ogv, 3gp`, but your browser must also support extension and codec of your choice, for example Firefox doesn't support `.mkv`, but Chrome does)
3. Share the folder with e-mail address of the account whose credentials the server is using (in case you haven’t set up the app locally, and you are using the online Heroku version, the e-mail is `annotation.tester@gmail.com`) and make sure you select `Editor` permissions (necessary for uploading resulting annotation JSON data back to that folder), in case you set up the app locally and you are using the same account for server API and client (where you put the video data), skip this step

## Usage
1. Use `import labels`  button and select .json file with labels definition, example labels file is shown in [labels format chapter](#labels-json-format)
2. Follow steps from [chapter about input video data](#input-video-data-setup)
3. Use import video button and insert Google Drive folder ID (folder ID can be obtained by copying last part of the URL after the last `/` when you are inside the folder on your Google Drive, it's a 33 characters long base 64 string)
4. Annotate your data
5. Press `Save` button to upload output JSON file with annotations back to the same Google Drive folder

## Selecting videos
To import videos to annotate use `Import video` button to open a modal. Insert ID of the shared Google Drive folder from [Input video data setup chapter](#input-video-data-setup). If you entered valid folder ID in the left panel you should see all available videos from the folder. On the right you can choose to create a new JSON file with output data or import existing output JSON file, if available. You can select up to 6 videos to annotate side by side. One limitation is that application can't detect FPS of the current video, so default is 30, but you can change the `FPS` variable in the `videoHandler.js`. Obviously, annotating multiple videos without same FPS side by side isn't possible.

## Syncing multiple videos
Multiple videos side by side can be synced using sliders above each video. Output JSON data will correctly reflect offset of each video.

## Video playback
Individual videos don't have their own controls so they can be in sync. Current position in the videos is depicted with white bar (scrubber) on the gray background (timeline) at the bottom of the page. Playback can be controlled using the buttons above the timeline or using [keyboard shortcuts](#video-playback-shortcuts). Playback speed can be changed with the slider in the bottom left part of the page.

## Annotating data
Clicking an item in the left label panel will create a new annotation, which will show up in the history panel. Annotations are depicted by colored trapezoids on the timeline. After adding annotation is not visible in the timeline until it doesn't have at least 2 keyframes. Annotation keyframes are added at the current position in the video using buttons in the bottom left corner or using [keyboard shortcuts](#annotation-shortcuts). Previous annotation can have readjusted keyframes by selecting it in the history panel. Annotation can be deleted by clicking trashcan icon next to it in the timeline, or by using `del` key on the currently selected one.

# Labels JSON format
You can choose one of the formats, functionally same, but they do have different appearance in the labels panel.

## Simple list of labels
```
{
    "name": "yoga",                                 // optional
    "description": "Sun salutation yoga poses",     // optional
    "items": [{                                     // required
            "name": "Equal Standing",               // required
            "color": "red"                          // optional, any color string that would work in CSS can be used (name, RGB, HEX, ...)
        },
        {
            "name": "Mountain with Bend Forward"
        },
        {
            "name": "Upward Hand"
        }
    ]
}
```

## Labels split into categories
```
{
    "name": "yoga",                                 // optional
    "description": "Sun salutation yoga poses",     // optional
    "categories": [{                                // required
        "name": "Some category",                    // required
        "items": [{                                 // required
            "name": "Equal Standing"                // required
        },
        {
            "name": "Mountain with Bend Forward"
        }
    ]
    },
    {
        "name": "Other category",
        "items": [
            {
                "name": "Warrior I with Palms at Heart"
            },
            {
                "name": "Warrior I"
            }
        ]
    }]
}
```


# Keyboard shortcuts

## Video playback shortcuts

| Key      | Action                                |
|----------|---------------------------------------|
| Space    | Play/Pause                            |
| k        | Play/Pause                            |
| m        | Mute/Unmute                           |
| ctrl + ← | Backward 1 seconds                    |
| ctrl + → | Forward 1 seconds                     |
| j        | Backward 10 seconds                   |
| l        | Forward 10 seconds                    |
| ←        | While paused, seek backward one frame |
| →        | While paused, seek forward one frame  |
| >        | Speed up video playback               |
| <        | Slow down video playback              |
| Home     | Seek to the beggining of the video    |
| End      | Seek to the end of the video          |
| f        | Enter/Exit fullscreen                 |

## Annotation shortcuts

| Key    | Action                                |
|--------|---------------------------------------|
| 1      | Rising edge start (Before)            |
| 2      | Rising edge end (Start)               |
| 3      | Best                                  |
| 4      | Falling edge start (End)              |
| 5      | Falling edge end (After)              |
| Delete | Delete selected annotation            |

# Output file format
Output file in JSON format is uploaded to the same folder in Google Drive. Annotating multiple videos will create correctly synced JSON file for each video. You can modify output file by selecting it when importing a video. This will display all existing annotations and will allow you to delete and add new annotations.

## Example
```
{
    "total-frames": 2726,
    "annotations": [
        {
            "name": "Equal Standing",
            "after": 255,
            "before": 179,
            "best": 222,
            "end": 241,
            "start": 198
        },
        {
            "name": "Standing Forward Flat",
            "after": 456,
            "before": 421,
            "best": 435,
            "end": 446,
            "start": 428
        },
        {
            "name": "Equal Standing",
            "after": 791,
            "before": 682,
            "best": 752,
            "end": 762,
            "start": 691
        }
    ]
}
```

# Link generator
![Link generator screenshot](https://i.imgur.com/EQgEZVw.png)

At http://video-anno.herokuapp.com/generator there is a generator for guest links. These links redirect to the application with some additional functionality:
- prefilled folder ID, so the guest doesn't have to provide one
- prefilled labels JSON, so the guest doesn't have to provide one
- lock for folder ID, so the guest can't change the folder ID
- labels lock, so the guest can't change the labels


# Local setup
## First time setup
1. Make sure you have [node.js](https://nodejs.org/) installed (verify installation by running `node -v`)
2. Run `npm install` in root directory
3. [Enable Google Drive API (only step 1)](https://developers.google.com/drive/api/v3/quickstart/nodejs#step_1_turn_on_the) When prompted select `Desktop app`, then click download client configuration. If you are going to use the server only yourself you can use your own Google account, otherwise I recommend creating a new Google account for this
4. Put downloaded `credentials.json` file from step 1 into `drive/` folder, upon starting the server for the first time you will be prompted to authentificate in the terminal

## Run server
1. Run `npm start` in root directory
2. Client page will be accessible at `localhost:3000`

# Program documentation
## Package dependencies
- [Express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js
- [Body parser](http://expressjs.com/en/resources/middleware/body-parser.html) - Parse incoming request bodies in a middleware
- [Google APIs](https://www.npmjs.com/package/googleapis#google-apis) - Node.js client library for using Google APIs
- [Nodemon](https://nodemon.io/) - Utility that will monitor for any changes in your source and automatically restart your server
- [EJS](https://ejs.co/) - Embedded JavaScript templating

## Client-side libraries
- [video.js](https://videojs.com/) - HTML5 player framework
- [jQuery](https://jquery.com/)

## File structure
```
Video-Annotation
│───app.js // server file, registering all the API endpoints
│───package.json
│───package-lock.json   
│───README.md // this file
│───LICENCE
│
│───public // client app
│   │───img/ // various images and icons
│   │───tmp/ // directory where videos to annotate will be downloaded from Google Drive API
│   │───index.ejs
│   │───index.css
│   │───index.js // loading labels, history panel, timeline slider
│   │───folderModal.js // modal, from which videos to annotate are selected
│   │───timeline.js // rendering annotation trapezoids on the timeline
│   │───videoHandler.js // video playback and synchronization
│   └───generator.html // subpage where one can generate links which include folderId and labels JSON data
│  
│───drive
│   │───drive.js // communication with Google Drive API
│   └───[this is where you want to place your credentials.json file]
│
└───examples
    │───yogaSimple.json // example JSON label file without categories
    └───yogaCategories.json // example JSON label file with labels split into categories
```

## API Endpoints
| Path        | Method   | Description                                                        |
|-------------|:--------:|--------------------------------------------------------------------|
|/            | GET  | Get client page                                                        |
|/generator   | GET  | Get guest link generator page                                          |
|/list        | GET  | Get list of all files in supplied folder ID                            |
|/video       | POST | Start downloading videos with supplied IDs                             |
|/videoStatus | GET  | Poll to see if all of the supplied videos are downloaded               |
|/videoFile   | GET  | Get the actual video file                                              |
|/jsonFile    | GET  | Get the actual JSON file with annotation data                          |
|/submit      | POST | Upload annotation JSON data                                            |


## Client-server communication
Due to the Heroku limitations on maximum HTTP response time being only 30 seconds, videos can't be requested and downloaded in a single HTTP request. Upon user entering folderID client requests list of the folder contents, server will pass this request onto Drive API. Selecting input videos and confirming will request `/video` endpoint. Server will start downloading the videos into `public/temp` folder with `.dl` temporary extentension to indicate download in progress. Once downloading of each file is done, the file is renamed to remove the `.dl` extension. During this time client will poll `/videoStatus` endpoint every 2 seconds to see if the download is done. If yes, client will request `/videoFile` for each video and will receive stream of video data.

Submitting data will simply user `/submit` endpoint which simply uploads output data as a JSON file with the same basename as video file into Google Drive folder. If there were multiple videos being annotated side by side then JSON file will be created for every one of them.

# Used libraries
## Debounce function
https://davidwalsh.name/javascript-debounce-function

## Wait until function
https://stackoverflow.com/a/64947598/4760478
