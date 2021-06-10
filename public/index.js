// setup label .json file importing

document.getElementById('upload-labels').addEventListener('click', promptUploadLabelFile);

function promptUploadLabelFile() {
    document.getElementById('fileid').click();
}

const REMOVE_BLUR_BACKDROP = true;

$(() => {
    // setup default params
    let defaultData = JSON.parse(defaultDataJSON);

    if (defaultData.defaultFolderId) {
        refreshFolderTable(defaultData.defaultFolderId);
        $("#folder-id-input").val(defaultData.defaultFolderId);
    }

    if (defaultData.defaultLabels) {
        setupLabels(JSON.stringify(defaultData.defaultLabels), true);
    }

    if (defaultData.folderIdBlock) {
        $("#folder-id-input").attr("disabled", "true");
    }

    if (defaultData.labelBlock) {
        $("#upload-labels").hide();
    }

    // if labels cookie is present use it
    availableLabels = getCookieValue("labels");

    if (availableLabels && availableLabels !== "null") {
        setupLabels(availableLabels, true);
    }
})

let folderId,
    videoName,
    availableLabels,
    presentLabels = {},
    selectedHistory = null,
    isModalOpen = false;

function getCookieValue(name) {
    var value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return value ? value.pop() : '';
}

// create a button in toolbar for each category 
function setupLabels(json, isFirstLoad = false) {
    let data;

    try {
        data = JSON.parse(json);
    }
    catch (error) {
        alert("Imported file is not valid JSON.");
        return;
    }

    document.cookie = "labels=" + JSON.stringify(data) + ";max-age=31536000";

    $("#toolbar .toolbar-item, .toolbar-category").not("#toolbar-item-template, #toolbar-category-template").remove();

    $("#toolbar-placeholder").hide();

    try {
        if (data.categories) {
            $("select").show();
            $("select").empty();

            data.categories.forEach((category, index) => {
                let newOption = $(`<option value="${index}"> ${category.name} </option>`).clone().show();
                $("select").append(newOption);

                category.items.forEach(item => {
                    let newItem = $("#toolbar-item-template").clone().show();

                    newItem.attr("categoryIndex", index);
            
                    // set color if provided, otherwise random color
                    if (item.color === undefined) {
                        item.color = "#" + intToRGB(hashCode(item.name));
                    }
            
                    newItem.find(".toolbar-img").css("background-color", item.color);
            
                    availableLabels = data;
            
                    newItem.find(".toolbar-text").html(item.name);
            
                    newItem.attr('id', item.name);
                    newItem.on('click', () => selectLabel(item.name, item.color));

                    // first category is selected by default, hide items from other categories
                    if (index !== 0) {
                        newItem.hide();
                    }
            
                    $("#toolbar").append(newItem);
                });
            });

            availableLabels = {
                items: availableLabels.categories.flatMap(category => category.items),
                ...data
            };
        }
        else {
            $("select").hide();

            data.items.forEach(item => {
                let newItem = $("#toolbar-item-template").clone().show();
        
                // set color if provided, otherwise random color
                if (item.color === undefined) {
                    item.color = "#" + intToRGB(hashCode(item.name));
                }
        
                newItem.find(".toolbar-img").css("background-color", item.color);
        
                newItem.find(".toolbar-text").html(item.name);
        
                newItem.attr('id', item.name);
                newItem.on('click', () => selectLabel(item.name, item.color));
        
                $("#toolbar").append(newItem);
            });

            availableLabels = data;
        }
    }
    catch (error) {
        if (!isFirstLoad) {
            alert("Imported file has missing required fields, please reffer to the documentation.");
        }
    }
};

/* Pseudo-random colors */
function hashCode(str) {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return hash;
}

function intToRGB(i) {
    let c = (i & 0x00FFFFFF).toString(16);

    return "00000".substring(0, 6 - c.length) + c;
}

/* Util functions */

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

const waitUntil = (condition, time = 100) => {
    return new Promise((resolve) => {
        let interval = setInterval(() => {
            if (!condition()) {
                return
            }

            clearInterval(interval)
            resolve()
        }, time)
    })
}

/* Left and right panel functions */

// when user clicks button add new entry to history
function selectLabel(name, color) {
    addToHistory(name, color);
}

function addToHistory(name, color, initialData) {
    // setup new history panel item
    let newItem = $("#history-item-template").clone();

    newItem.show();

    // set gray subtext
    newItem.find(".toolbar-subtext").html("");

    // set text
    newItem.find(".toolbar-text").html(name);

    // set image bg color
    newItem.find(".toolbar-img").css("background-color", color);

    // setup on click handler
    newItem.click(() => selectFromHistory(newItem));
    
    // setup delete button on click handler
    newItem.find("button").click(() => deleteFromHistory(newItem));

    $("#history").append(newItem);

    const uniqueName = initialData?.uniqueName || name + "_" + Object.values(presentLabels).filter(item => item.name === name).length;
    
    initialData && delete initialData.uniqueName;

    presentLabels = {
        ...presentLabels,
        [uniqueName]: initialData || {
            name: name,
            before: -1,
            start: -1,
            best: -1,
            end: -1,
            after: -1
        }
    }; 

    newItem.attr("name", uniqueName);

    // select the new element
    selectFromHistory(newItem);
};

// user clicked on an item from history panel
function selectFromHistory(element) {
    // unhighlight other items and annotations and highlight selected item
    $("#history .toolbar-item").css("background-color", "");

    // highlight selected annotation in history panel
    element.css("background-color", "skyblue");

    selectedHistory = element.attr("name");

    // un-highlight all trapezoids and highlight selected annotation trapezoid in timeline
    $(`g`).find("line").attr("stroke-width", "2");
    getTrapezoid(selectedHistory).find("line").attr("stroke-width", "5");
}

// user clicked delete button on an item from history panel
function deleteFromHistory(historyPanelElement) {
    const name = historyPanelElement.attr("name");

    delete presentLabels[name];

    historyPanelElement.remove();
    getTrapezoid(name).remove();

    if (name === selectedHistory) {
        selectedHistory = null;
    }
}

// when user clicked Submit button send annotation data in JSON format to be uploaded to Google Drive
const submitAnnotations = () => {
    let isConfirmed = true;

    /*
    if (annotationArray.length === 0) {
        isConfirmed = window.confirm("Are you sure you want to submit this image without annotations?");
    }
    */

    startLoading();

    if (isConfirmed) {
        const data = JSON.stringify(convertToOutputFormat());

        $.post({
            url: '/submit',
            data: {
                folderId,
                data
            },
            success: () => {
                stopLoading();
                setTimeout(() => {
                    alert("JSON data saved successfully.");
                }, 100);
                
            },
            error: () => {
                stopLoading();
                setTimeout(() => {
                    alert("There was an error uploading JSON data.");
                }, 100);
            }
        });
    }
}

function convertToOutputFormat() {
    const videoBasenames = JSON.parse(videoNames).map(name => name.split('.').slice(0, -1).join('.'))
    const videoDelays = allPlayers.map(player => player.delay);

    const output = videoBasenames.map((name, index) => ({ 
        name,
        delay: Math.round(videoDelays[index] * FPS),
        data: {
            "total-frames": Math.round(allPlayers[index].duration() * FPS),
            annotations: [...Object.values(presentLabels).map(anno => ({ 
                name:   anno.name,
                after:  Math.round(anno.after + videoDelays[index] * FPS),
                before: Math.round(anno.before + videoDelays[index] * FPS),
                best:   Math.round(anno.best + videoDelays[index] * FPS),
                end:    Math.round(anno.end + videoDelays[index] * FPS),
                start:  Math.round(anno.start  + videoDelays[index] * FPS)
            }))]
        }
    }));

    return output;
}

function selectCategory(selectElement) {
    var categoryIndex = selectElement.value;  
    $("#toolbar .toolbar-item").hide();
    $(`.toolbar-item[categoryIndex=${categoryIndex}]`).show();
}

/* LOADING SPINNER */

function startLoading() {
    $(".spinner").show();
    $("#main").addClass("blur");
}

function stopLoading() {
    $(".spinner").hide();
    $("#main").removeClass("blur");
}

/* DELAY SLIDERS */

$(".delay-slider input[type='range']").on("input", event => {
    let sliderId = $(event.target).attr("name");

    $(`.delay-slider input[type='number'][name='${sliderId}']`).val(event.target.value);

    if (allPlayers.length === 4 && sliderId > 2) sliderId--;

    allPlayers[parseInt(sliderId)].delay = parseFloat(event.target.value) / FPS;

    syncAll();
});

$(".delay-slider input[type='number']").on("input", event => {
    let sliderId = $(event.target).attr("name");

    $(`.delay-slider input[type='range'][name='${sliderId}']`).val(event.target.value);

    if (allPlayers.length === 4 && sliderId > 2) sliderId--;

    allPlayers[parseInt(sliderId)].delay = parseFloat(event.target.value) / FPS;

    syncAll();
});

function setupLayout(count) {
    if (count === 1) {
        $(".video-js").css("height", "100%");
        $(".delay-slider").hide();
    }
    else {
        $(".video-js").css("height", "calc(100% - 25px)");
        $(".delay-slider").show();
    }

    if (count === 4) {
        $(".video-row").show();

        $(".video-row > td").eq(0).show();
        $(".video-row > td").eq(1).show();
        $(".video-row > td").eq(2).hide();
        $(".video-row > td").eq(3).show();
        $(".video-row > td").eq(4).show();
        $(".video-row > td").eq(5).hide();
    }
    else {
        $(".video-row > td").slice(0, count).show();
        $(".video-row > td").slice(count, 6).hide();

        if (count > 3) {
            $(".video-row").eq(1).show();
        }
        else {
            $(".video-row").eq(1).hide();
        }
    }
}