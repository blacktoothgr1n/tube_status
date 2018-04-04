function refresh_data() {
    var global_timeout_sec = 10;
    setTimeout(page_handler, (global_timeout_sec * 1000));
}

function get_tfl_data(tfl_uri) {
    var promise = new Promise(function(resolve, reject) {
        clear_error(document);
        fetch(tfl_uri)
            .then(function(response) {
                if (response.ok) {
                    return response.blob();
                } else {
                    reject('[!] Unable to retrieve valid response from TFL API');
                }
            })
            .then(function(data) {
                var reader = new FileReader();
                reader.onload = function() {
                    resolve(JSON.parse(reader.result));
                };
                reader.readAsText(data);
            })
            .catch(function(err) {
                reject(err);
                set_error(document, err);
            });
    });
    return promise;
}

function get_header_html(running_platform) {
    var os_pic = 'os_unknown.png';
    var os_match = {
        'Lin': 'os_linux.png',
        'Mac': 'os_mac.png',
        'Win': 'os_windows.png'
    }
    for (var os_type in os_match) {
        if (running_platform.indexOf(os_type) >= 0) {
            os_pic = os_match[os_type];
            break;
        }
    }
    var header_row = '<tr><td id="header_row" colspan=2>Tube<img id="header_pic" src="./images/' +
                        os_pic + '">Status</td></tr>';
    return header_row;
}

function get_last_refresh_html() {
    var refresh_row = '<tr><td id="last_refresh_time" colspan=2>Last update: ' +
        new Date().toString() + '</td></tr>';
    return refresh_row;
}

function set_severity_class(severity_id) {
    switch (severity_id) {
        case 10:
            return 'status_good';
        default:
            return 'status_bad';
    }
}

function format_lines(tube_data) {
    var table = '<table border="1" id="line_status_tbl">';
    table += get_header_html(navigator.platform);
    table += get_last_refresh_html();
    for (var line in tube_data) {
        var cur_id = tube_data[line]['id'];
        var cur_name = tube_data[line]['name'];
        cur_name = cur_name.replace('&', '/');
        var cur_status = tube_data[line].lineStatuses[0].statusSeverityDescription;
        var cur_severity = tube_data[line].lineStatuses[0].statusSeverity;
        var td_status_class = set_severity_class(cur_severity);
        var cur_reason = tube_data[line].lineStatuses[0].reason;
        if (cur_reason) {
            // Not doing anything here if we already have the value
        } else {
            cur_reason = '';
        }
        table += '<tr><td id="' + cur_id + '" class="' + cur_id + '">' + cur_name + '</td>';
        table += '<td id="' + cur_id + '_status" class="' + td_status_class
                    + '" title="' + cur_reason + '">' + cur_status + '</td></tr>';
    }
    table += '</table>';
    return table;
}

function clear_error(doc) {
    doc.body.classList.remove('global_error');
    doc.getElementById('warning_panel').innerHTML = '';
}

function set_error(doc, err) {
    var err_msg = 'Sorry, something went wrong...\n' +
                    'Last refresh:\n' + new Date().toLocaleString() +
                    '\n' + err.message;
    doc.body.classList.add('global_error');
    doc.getElementById('warning_panel').innerHTML = err_msg;
}

function page_runner() {
    var tube_data_uri = 'https://api.tfl.gov.uk/line/mode/tube/status?detail=true';
    return new Promise(function(resolve, reject) {
        get_tfl_data(tube_data_uri)
            .then(function(line_data) {
                var tube_table = format_lines(line_data);
                document.getElementById('line_status').innerHTML = tube_table;
                resolve(tube_table);
            })
            .catch(function(err) {
                reject(err);
            })
            .finally(function() {
                refresh_data();
            });
    });
}

function page_handler() {
    page_runner();
}
