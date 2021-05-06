'use strict';

// Create an instance
var wavesurfer = Object.create(WaveSurfer);

// Init & load audio file
document.addEventListener('DOMContentLoaded', function () {
    var options = {
        container     : document.querySelector('#waveform'),
        height: 100,
        pixelRatio: 1,
        scrollParent: true,
        waveColor     : 'violet',
        progressColor : 'purple',
        loaderColor   : 'purple',
        cursorColor   : 'navy'
    };

    if (location.search.match('scroll')) {
        options.minPxPerSec = 100;
        options.scrollParent = true;
    }

    // Init
    wavesurfer.init(options);
    // Load audio from URL
    wavesurfer.util.ajax({
        responseType: 'json',
        url: 'static/json/rashomon.json'
    }).on('success', function (data) {
        wavesurfer.load(
            'static/media/test.mp3',
            data
        );
    });



    // Regions
    if (wavesurfer.enableDragSelection) {
        wavesurfer.enableDragSelection({
            color: 'rgba(0, 255, 0, 0.1)'
        });
    }


    /* Regions */

     wavesurfer.on('ready', function() {
         if (localStorage.regions) {
            loadRegions(JSON.parse(localStorage.regions));
        } else {
            // loadRegions(
            //     extractRegions(
            //         wavesurfer.backend.getPeaks(512),
            //         wavesurfer.getDuration()
            //     )
            // );
            wavesurfer.util.ajax({
                responseType: 'json',
                url: 'annotations.json'
            }).on('success', function (data) {
                loadRegions(data);
                saveRegions();
            });
        }
     });

     wavesurfer.on('region-click', function (region, e) {
        e.stopPropagation();
        // Play on click, loop on shift click
        e.shiftKey ? region.playLoop() : region.play();
    });
    wavesurfer.on('region-click', editAnnotation);
    wavesurfer.on('region-updated', saveRegions);
    wavesurfer.on('region-removed', saveRegions);
    wavesurfer.on('region-in', showNote);

    // Report errors
    wavesurfer.on('error', function (err) {
        console.error(err);
    });

    // Do something when the clip is over
    wavesurfer.on('finish', function () {
        console.log('Finished playing');
    });

});


function createTable()
{

    var datatable = Object.keys(wavesurfer.regions.list).map(function(id) {
             let region = wavesurfer.regions.list[id];
             return {
                 start: region.start,
                 end: region.end,
                 attributes: region.attributes,
                 data: region.data
             };
         })

    // EXTRACT VALUE FOR HTML HEADER.
    // ('Book ID', 'Book Name', 'Category' and 'Price')
    var col = [];
    col.push("START");
    col.push("END");
    col.push("ANNOTATION");

    console.log("col: ", col);

    // CREATE DYNAMIC TABLE.
    var table = document.createElement("table");
    table.setAttribute('class', "table table-bordered");

    // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

    var tr = table.insertRow(-1);                   // TABLE ROW.

    for (var i = 0; i < col.length; i++) {
        var th = document.createElement("th");      // TABLE HEADER.
        th.innerHTML = col[i];
        tr.appendChild(th);
    }

    var header_list = ["start", "end", "data"];
    // ADD JSON DATA TO THE TABLE AS ROWS.
    for (var i = 0; i < datatable.length; i++) {

        tr = table.insertRow(-1);

        for (var j = 0; j < col.length; j++) {
            var tabCell = tr.insertCell(-1);
            var content = datatable[i][header_list[j]];
            if(j == 2)
            {
                content = content.note;
                if(content == "" || typeof content == 'undefined')
                {
                    content = "No Annotation";
                }
            }
            tabCell.innerHTML = content;

            console.log("content: ", content);
        }
    }


    console.log("table: ", table);
    return table;
}

/**
* Display regions from regions.
*/
function displayRegions(regions) {

 }

 /**
  * Load regions from regions.
  */
 function loadRegions(regions) {
     regions.forEach(function(region) {
         region.color = randomColor(0.1);
         wavesurfer.addRegion(region);
     });
 }

var count = 0;
 /**
  * Save annotations to regions.
  */
 function saveRegions() {
//     document.getElementById("displayA").innerHTML = JSON.stringify(regions, null, 4);
     count = count + 1;

     var data1 = JSON.stringify(
         Object.keys(wavesurfer.regions.list).map(function(id) {
             let region = wavesurfer.regions.list[id];
             return {
                 start: region.start,
                 end: region.end,
                 attributes: region.attributes,
                 data: region.data
             };
         })
     );
    localStorage.regions = data1;

    var table = createTable();
    // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
    var divContainer = document.getElementById("annotation-table");
    divContainer.innerHTML = "";
    divContainer.appendChild(table);
    divContainer.style.display = "block";

 }

 /**
 * Random RGBA color.
 */
function randomColor(alpha) {
    return 'rgba(' + [
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        alpha || 1
    ] + ')';

}


/**
 * Edit annotation for a region.
 */
function editAnnotation (region) {
    var form = document.forms.edit;
    form.style.opacity = 1;
    form.elements.start.value = Math.round(region.start * 10) / 10,
    form.elements.end.value = Math.round(region.end * 10) / 10;
    form.elements.note.value = region.data.note || '';
    form.onsubmit = function (e) {
        e.preventDefault();
        region.update({
            start: form.elements.start.value,
            end: form.elements.end.value,
            data: {
                note: form.elements.note.value
            }
        });
        form.style.opacity = 0;
    };
    form.onreset = function () {
        form.style.opacity = 0;
        form.dataset.region = null;
    };
    form.dataset.region = region.id;
}


/* Progress bar */
document.addEventListener('DOMContentLoaded', function () {
    var progressDiv = document.querySelector('#progress-bar');
    var progressBar = progressDiv.querySelector('.progress-bar');

    var showProgress = function (percent) {
        progressDiv.style.display = 'block';
        progressBar.style.width = percent + '%';
    };

    var hideProgress = function () {
        progressDiv.style.display = 'none';
    };

    wavesurfer.on('loading', showProgress);
    wavesurfer.on('ready', hideProgress);
    wavesurfer.on('destroy', hideProgress);
    wavesurfer.on('error', hideProgress);
});

 /**
  * Display annotation.
  */
 function showNote(region) {
     if (!showNote.el) {
         showNote.el = document.querySelector('#subtitle');
     }
     showNote.el.textContent = region.data.note || '–';
 }

 /**
 * Bind controls.
 */
GLOBAL_ACTIONS['delete-region'] = function () {
    var form = document.forms.edit;
    var regionId = form.dataset.region;
    if (regionId) {
        wavesurfer.regions.list[regionId].remove();
        form.reset();
    }
};

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

GLOBAL_ACTIONS['export'] = function () {

    var datatexport = Object.keys(wavesurfer.regions.list).map(function(id) {
             let region = wavesurfer.regions.list[id];
             return {
                 start: region.start,
                 end: region.end,
                 attributes: region.attributes,
                 data: region.data
             };
         });
    datatexport = JSON.stringify(datatexport, null, 4)

    // Start file download.
    download("annotation.txt",datatexport);


};

// Drag'n'drop
document.addEventListener('DOMContentLoaded', function () {
    var toggleActive = function (e, toggle) {
        e.stopPropagation();
        e.preventDefault();
        toggle ? e.target.classList.add('wavesurfer-dragover') :
            e.target.classList.remove('wavesurfer-dragover');
    };

    var handlers = {
        // Drop event
        drop: function (e) {
            toggleActive(e, false);

            // Load the file into wavesurfer
            if (e.dataTransfer.files.length) {
                console.log("wavesurfer.loadBlob");
                wavesurfer.loadBlob(e.dataTransfer.files[0]);
                 console.log("wavesurfer.loadBlob END");
            } else {
                wavesurfer.fireEvent('error', 'Not a file');
            }
        },

        // Drag-over event
        dragover: function (e) {
            toggleActive(e, true);
        },

        // Drag-leave event
        dragleave: function (e) {
            toggleActive(e, false);
        }
    };

    var dropTarget = document.querySelector('#drop');
    Object.keys(handlers).forEach(function (event) {
        dropTarget.addEventListener(event, handlers[event]);
    });
});