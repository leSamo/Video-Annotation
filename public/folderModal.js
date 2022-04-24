let folderFiles, videoFiles, jsonFiles;
const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "wmv", "flv", "avi", "webm", "mpg", "ogv", "3gp"]

function openModal() {
    isModalOpen = true;

    $("#main").addClass("blur");

    $("#folder-modal").show();
}

function closeModal(removeBlur = false) {
    isModalOpen = false;

    $("#folder-modal").hide();

    if (removeBlur) {
        $("#main").removeClass("blur");
    }
}

let passthrough = false;

function getDownloadStatus(filenames) {
    $.get(`/videoStatus?filenames=${encodeURIComponent(JSON.stringify(filenames))}`, function(data, statusText, xhr) {
        passthrough = data.all;
    });
}

// user clicked OK in modal, check if user selected anything, if yes, download video, possible JSON file too
function confirmModal() {
    const selectedVideos = getSelectedVideos();
    const selectedJson = getSelectedJson();
    const selectedFPS = parseInt($("#fps-input").val());
    
    if (selectedVideos.length === 0) {
        if (folderFiles) {
            alert("Select at least one video from the list to proceed.");
        }
        else {
            alert("Input valid folder ID and select a video file.");
        }
        return;
    }
    else if (selectedVideos.length > 6) {
        alert("Please select at most 6 videos.");
        return;
    }

    if (isNaN(selectedFPS) || selectedFPS < 1 || selectedFPS > 1000) {
        alert("Set FPS to a number between 1 and 1000.")
        return;
    }

    FPS = selectedFPS;

    videoIds = JSON.stringify(selectedVideos.map(video => video.id));
    videoNames = JSON.stringify(selectedVideos.map(video => video.name));
    jsonId = selectedJson?.id;
    
    folderId = $("#folder-id-input").val();

    // reset item selection to default
    $("#folder-modal input[type=checkbox]:checked").prop("checked", false);
    $("#folder-modal input[type=radio][index=-1]").prop("checked", true);

    startLoading();

    $.post("/video", { folderId, videoIds, jsonId, videoNames },
        async data => {
            const filenames = data.videoIds.map((videoId, index) => videoId + "." + data.videoNames[index].split(".").pop());

            passthrough = false;
            await waitUntil(() => getDownloadStatus(filenames) || passthrough, 2000); 

            stopLoading();

            if (data.error) {
                console.error(data.errorMsg);
            } else {
                $(".video-row").show();

                allPlayers = data.videoIds.map((id, index) => {
                    if (data.videoIds.length === 4 && index > 1) index++; 
                    return videojs('my-video' + index)
                });

                setupLayout(allPlayers.length);

                $(`.delay-slider input`).val(0);

                allPlayers.forEach((player, index) => {
                    player.delay = 0;
                    player.controls(false);
                    player.src({ type: 'video/mp4', src: `/videoFile?fileId=${data.videoIds[index]}&ext=${data.videoNames[index].split(".").pop()}` });
                });

                $("#container-info").hide();

                if (data.videoNames.length === 1) {
                    $("#title-text").html(data.videoNames[0]);
                }
                else {
                    $("#title-text").html(data.videoNames[0] + ` and ${data.videoNames.length - 1} more`);
                }
                
                await waitUntil(() => allPlayers.every(player => player.readyState() >= 1));

                if (data.jsonId) {
                    $.get(`/jsonFile?fileId=${data.jsonId}`, jsonData => {
                        loadTimelineFromJson(jsonData);
                    }, {}, "json");
                }
            }
        });

    closeModal();

    // reset everything
    presentLabels = {};
    selectedHistory = null;
    $("g").remove();
    $("#history .toolbar-item:visible").remove();
    $("#speed-slider").val(4);
    $("#speed-label").html("1.0x");
}

$("#folder-id-input").on("input",
    debounce(function() {
        refreshFolderTable($("#folder-id-input").val());
    }, 500)
);

function refreshFolderTable(folderId) {
    // request image name, attach folder ID to the request
    $.get(`/list?folderId=${folderId}`,
    data => {
        if (data.error || !data.folderData) {
            $("#folder-id-input").css("background-color", "#ff8a8a");

            clearFolderTable();
            $("#folder-placeholder").show();
        } else {
            $("#folder-id-input").css("background-color", "#9aff8a");
            folderDataToTable(data.folderData);
        }
    });
}

function folderDataToTable(folderData) {
    $("#folder-modal-text").hide();
    $("#folder-modal-grid").css("display", "grid");

    clearFolderTable();

    folderFiles = folderData;

    videoFiles = folderData.filter(item => {
        try {
            const extension = item.name.slice(item.name.lastIndexOf(".") + 1);
            return VIDEO_EXTENSIONS.includes(extension);
        }
        catch {
            return false;
        }
    });

    jsonFiles = folderData.filter(item => {
        try {
            const extension = item.name.slice(item.name.lastIndexOf(".") + 1);
            return extension === "json";
        }
        catch {
            return false;
        }

    });

    let newRows = [];

    videoFiles.forEach((file, index) => {
        const newRow = $("#video-table .template").clone().show().removeClass("template");

        newRow.html(`<label><input type="checkbox" name=${index}>${file.name}</label>`);
        newRow.attr('id', file.name);

        newRows.push(newRow);
    });

    $("#video-table").append(...newRows);

    newJsonRows = [];

    jsonFiles.forEach((file, index) => {
        const newJsonRow = $("#json-table .template").clone().show().removeClass("template");

        newJsonRow.html(`<label><input type="radio" name="json" index="${index}">${file.name}</label>`);
        newJsonRow.attr('id', file.name);

        newJsonRows.push(newJsonRow);
    });

    $("#json-table").append(...newJsonRows);
}

// clear all rows from previous queries
function clearFolderTable() {
    $(".file-row:visible").not("#none").remove();
}

function getSelectedVideos() {
    const files = $("#folder-modal input[type=checkbox]:checked").map(function() {
        return videoFiles[$(this).attr("name")];
    });

    return files.get();
}

function getSelectedJson() {
    const index = $("#folder-modal input[type=radio]:checked").attr("index");

    if (index == -1) {
        return null;
    }
    else {
        return jsonFiles[index];
    }
}