/* eslint no-undef: "off" */
describe('Tube Status Unit Tests', function() {

    jasmine.getFixtures().fixturesPath = '/base';
    if (document.title.length > 0) {
        broken_data_link = '../spec/tube_data_broken.json';
    } else {
        broken_data_link = 'base/spec/tube_data_broken.json';
    }

    beforeEach(function() {
        tube_lines_uri = 'https://api.tfl.gov.uk/line/mode/tube/status?detail=true';
        fake_tube_uri = 'https://api.tfl.gov.uk/line/mode/tubes/status?detail=true';
        setFixtures('<div id="line_status"></div><p id="warning_panel"></p>')
    });

    it('[Unit Test] line issue adds a reason to format_lines(tube_data) table', function(done) {
        var match;
        var promise = new Promise(function(resolve, reject) {
            fetch(broken_data_link)
                .then(function(response) {
                    if (response.ok) {
                        return response.blob();
                    } else {
                        reject('[!] Something went wrong loading the fake tube data');
                    }
                })
                .then(function(data) {
                    var reader = new FileReader();
                    reader.onload = function() {
                        var test_table = format_lines(JSON.parse(reader.result));
                        match = test_table.indexOf('Media station left fake news all over the line');
                        expect(match).not.toBe(-1, '[!] Did not find fake line reason injected into html table');
                        done();
                    }
                    reader.readAsText(data);
                });
        });
        return promise;
    });

    it('[Unit Test] refresh_data calls setTimeout()', function(done) {
        spyOn(window, 'setTimeout');
        refresh_data();
        expect(setTimeout).toHaveBeenCalled();
        done();
    });

    it('[Unit Test] get_tfl_data(tfl_uri) called with correct URL', function(done) {
        spyOn(window, 'get_tfl_data').and.callThrough();
        get_tfl_data(tube_lines_uri)
            .finally(function() {
                expect(window.get_tfl_data).toHaveBeenCalledWith(tube_lines_uri);
                done();
            });
    });

    it('[Unit Test] page_handler() calls page_runner()', function() {
        spyOn(window, 'page_runner');
        page_handler();
        expect(page_runner).toHaveBeenCalled();
    });

    it('[Unit Test] get_tfl_data() calls clear_error()', function(done) {
        spyOn(window, 'clear_error').and.callThrough();
        get_tfl_data(tube_lines_uri)
            .finally(function() {
                expect(clear_error).toHaveBeenCalled();
                done();
        });
    });

    it('[Unit Test] page_runner() returns a Promise', function() {
        var my_page_runner = page_runner();
        expect(my_page_runner).toEqual(jasmine.any(Promise));
    });

    it('[Unit Test] page_runner() catches error during get_tfl_data().then', function(done) {
        var fake_error = {'message': 'more_fake_news'};
        spyOn(window, 'get_tfl_data').and.returnValue(Promise.reject(fake_error));
        page_runner()
            .catch(function(err) {
            expect(err).toEqual(fake_error);
            })
            .finally(function() {
                done();
                clear_error(document);
            });
    });

    it('[Unit Test] get_tfl_data(tfl_uri) catches error during fetch', function(done) {
        setFixtures();
        var fake_error = {'message': 'fake_news'};
        spyOn(window, 'get_tfl_data').and.returnValue(Promise.reject(fake_error));
        var tube_promise = get_tfl_data(tube_lines_uri);
        tube_promise.catch(function(err) {
            expect(err).toEqual(fake_error);
            done();
        });
    });

    it('[Unit Test] get_tfl_data() returns an error on invalid response', function(done) {
        try {
            var rejected_promise = get_tfl_data(fake_tube_uri);
            rejected_promise.catch(function(err) {
                expect(err).toEqual('[!] Unable to retrieve valid response from TFL API');
                done();
            });
        } catch (fake_ex) {
            // Not doing anything here - bad response expected
        }
    });

    it('[Unit Test] get_tfl_data(tfl_uri) should return a Promise', function() {
        var tube_data = get_tfl_data(tube_lines_uri);
        expect(tube_data).toEqual(jasmine.any(Promise));
    });

    it('[Unit Test] get_header_html() returns a valid picture', function() {
        var all_os = [
            'Linux',
            'Mac',
            'Windows',
            'Unknown'
        ];
        for (var index in all_os) {
            var cur_os = all_os[index];
            var cur_header = get_header_html(cur_os);
            var pic_found = cur_header.indexOf('os_' + cur_os.toLowerCase() + '.png');
            expect(pic_found).not.toBe(-1, '[!] Did not find os_' + cur_os.toLowerCase() + '.png');
        }
    });

    it('[Unit Test] get_last_refresh_html() returns a date within the last 60s', function() {
        var last_refresh = get_last_refresh_html();
        var re = /Last update:(.*?).GMT/g;
        var match = re.exec(last_refresh)[0];
        var date_string = match.replace('Last update: ', '');
        try {
            var received_date = Date.parse(date_string);
            var date_now = new Date();
            expect(date_now - received_date).toBeLessThan(60 * 1000);
        } catch (err) {
            console.log('[!] Something went wrong trying to parse ' +
            'the date from get_last_refresh_html()\n' + err);
        }
    });

    it('[Unit Test] set_severity_class(xx) returns correct status', function() {
        var sev_classes = {
            '1': 'status_bad',
            '10': 'status_good',
            '5': 'status_bad'
        }
        for (var key in sev_classes) {
            var value = sev_classes[key];
            var cur_key = parseInt(key, 10);
            expect(set_severity_class(cur_key)).toEqual(value);
        }
    });

    it('[Unit Test] get_tfl_data(tfl_uri) returns 11 lines', function(done) {
        var tube_data = get_tfl_data(tube_lines_uri);
        tube_data.then(function(data) {
            expect(data.length).toBe(11, '[!] Expected 11 lines but received: ' + data.length);
            done();
        });
    });

    it('[Unit Test] format_lines(tube_data) returns <table></table> tags', function(done) {
        var tube_data = get_tfl_data(tube_lines_uri);
        tube_data.then(function() {
            var line_data = format_lines(tube_data);
            var re = /<table.*<\/table>/g;
            var match = re.exec(line_data)[0];
            expect(match).toBeDefined();
            done();
        });
    });

    it('[Unit Test] set_error adds global_error css class to document body', function() {
        set_error(document, {'message': 'global_error_class_test'});
        var class_matched = document.body.classList.contains('global_error');
        expect(class_matched).toEqual(true, '[!] Expected global_error added to body class');
        clear_error(document);
    });

    it('[Unit Test] set_error adds Network Error to warning_panel', function() {
        var err_msg = 'Network error';
        set_error(document, {'message': err_msg});
        var found = document.getElementById('warning_panel').innerHTML.indexOf(err_msg);
        expect(found).not.toEqual(-1, '[!] Expected warning_panel to match error message');
        clear_error(document);
    });

});
