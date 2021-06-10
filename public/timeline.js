let Timeline = {
    get width() {
        return $("#timeline").get(0).getBoundingClientRect().width;
    }
}

// in HTML svg (0,0) is in the top left corner
const lowerY = 170;
const upperY = 30;

function drawTrapezoid(points, color, name) {
    let trapezoid = getTrapezoid(name);

    points = points.filter(pointX => pointX > 0);

    if (trapezoid.length === 0) {
        trapezoid = $("<g></g>");
    } else {
        trapezoid.empty();
    }

    if (points.length >= 2) {
        trapezoid.append(createLine(points[0], lowerY, points[1], upperY, color));
    }
    if (points.length >= 4) {
        trapezoid.append(createLine(points[1], upperY, points[3], upperY, color));
    }
    if (points.length === 5) {
        trapezoid.append(createLine(points[3], upperY, points[4], lowerY, color));
    }

    if (points.length >= 3) {
        trapezoid.append(createCircle(points[2], upperY, 2, "skyblue"));
    }

    trapezoid.attr("name", name);

    $("#timeline svg").append(trapezoid);

    // refresh svg DOM
    $('#timeline').html($('#timeline').html());
}

function createLine(x1, y1, x2, y2, color) {
    return `<line x1="${x1 * 100}%" y1="${y1}" x2="${x2 * 100}%" y2="${y2}" stroke="${color}" stroke-width="5" stroke-linecap="round" />`;
}

function createCircle(x, y, r, color) {
    return `<circle cx="${x * 100}%" cy="${y}" r="${r}" stroke="${color}" stroke-width="3" fill="${color}" />`;
}

function loadTimelineFromJson(data) {
    let unknownLabelCount = 0;

    data.annotations.forEach(anno => {
        let color;

        if (availableLabels.items.find(label => label.name === anno.name)) {
            color = availableLabels.items.find(label => label.name === anno.name).color;
        }
        else {
            color = "#" + intToRGB(hashCode(anno.name));
            unknownLabelCount++;
        }

        const initialData = {
            ...anno
        }

        addToHistory(anno.name, color, initialData);
        refreshKeyframes();
    });

    if (unknownLabelCount > 0) {
        alert(`Loaded ${unknownLabelCount} label(s) from JSON which are not imported, this will lead to mismatched annotation colors if you override default colors in your labels JSON file. Please, import correct labels before importing video to avoid this.`);
    }
}

function getTrapezoid(name) {
    return $(`g[name="${name}"]`);
}
