#!/usr/bin/python
import os
import yaml
import json
import uuid
import datetime
from subprocess import Popen, PIPE, STDOUT, CalledProcessError
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from copy import deepcopy


def get_hosts(inv_data):
    all_hosts = {}
    for key, value in inv_data.iteritems():
        if 'hosts' in value:
            all_hosts.update(inv_data[key]['hosts'])
    return all_hosts


def get_hosts_ip_and_port(host_data):
    data_list = []
    for single_host in host_data:
        data_list.append(single_host + ':' +
                         str(host_data[single_host]['http_port']))
    return data_list


def get_hostname_by_ip(host_data, ip):
    actual_ip = ip.split(':')[0]
    for single_host in host_data:
        if single_host == actual_ip:
            return host_data[single_host]['vm_hostname']


def get_tests_by_type(all_specs, req_type):
    found_specs = []
    for spec in all_specs:
        if spec['test_type'] == req_type:
            found_specs.append(spec)
    return found_specs


def replace_url_in_test(test_spec, ip):
    for key, value in test_spec.iteritems():
        if str(key) == 'url':
            cur_spec = deepcopy(test_spec)
            cur_spec[key] = 'http://' + ip + value
            return cur_spec


def replace_var_in_test(test_spec, var_name, old_value, new_value):
    for key, value in test_spec.iteritems():
        if str(key) == var_name:
            # print test_spec
            cur_spec = deepcopy(test_spec)
            spec_value = value.replace(old_value, new_value)
            cur_spec[key] = spec_value
            return cur_spec


def correct_num_lines(rows_found):
    num_tube_lines = 11
    if rows_found == num_tube_lines:
        print '[+] Correct number of tube lines found in html: ', num_tube_lines
        return True
    print '[!] Incorrect number of tube lines found in html: ', rows_found
    return False


def get_hosts_by_node_name(inventory, node_name):
    for node in inventory:
        if node == node_name:
            return inventory[node]['hosts']


def get_node_var(node_name, var_name, inventory):
    for node in inventory:
        if node == node_name:
            selected_node = inventory[node]['hosts']
            break
    if selected_node:
        for key, value in selected_node.iteritems():
            if var_name in value:
                return value[var_name]


def run_karma():
    karma_bin = '/vagrant/html/node_modules/.bin/karma'
    karma_conf = '/vagrant/html/karma.conf.js'
    if not os.path.exists(karma_bin):
        print '[!] Missing path for Karma: ' + karma_bin + ' is karma installed?'
        return
    if not os.path.exists(karma_conf):
        print '[!] Missing Karma conf: ' + karma_conf + ' unable to proceed'
        return
    try:
        print '[-] Starting Karma'
        output = Popen([karma_bin, 'start', karma_conf],
                       stderr=STDOUT, stdout=PIPE)
        out_msg = output.communicate()[0]
        if output.returncode == 0:
            print '[+] Karma run completed successfully'
            print out_msg
        else:
            print '[!] There were issues during the Karma run'
            print out_msg
    except CalledProcessError as e:
        print '[!] There were problems running the Karma task:\n' + e
    return out_msg


def run_linting(uuid_in):
    lint_bin = '/vagrant/html/node_modules/.bin/eslint'
    lint_rc = '/vagrant/html/.eslintrc.js'
    lint_ig = '/vagrant/html/.eslintignore'
    lint_dir = '/vagrant/html'
    if not os.path.exists(lint_bin):
        print '[!] Missing path for eslint: ' + lint_bin + ' is eslint installed?'
        return
    if not os.path.exists(lint_rc):
        print '[!] Missing path for .eslintrc.js: ' + lint_rc
        return
    if not os.path.exists(lint_ig):
        print '[!] Missing path for .eslintignore: ' + lint_ig
        return
    if not os.path.exists(lint_dir):
        print '[!] Missing path for linting dir: ' + lint_dir
        return
    print '[-] Starting linting test'
    try:
        output = Popen([lint_bin, '-c', lint_rc, '--ignore-path',
                        lint_ig, lint_dir], stderr=STDOUT, stdout=PIPE)
        out_msg = output.communicate()[0]
        if output.returncode == 0:
            final_msg = '[+] No errors from eslint while linting: ' + lint_dir
            print final_msg
        else:
            final_msg = '[!] There were linting errors from eslint:\n' + out_msg
            print final_msg
    except CalledProcessError as e:
        final_msg = '[!] There were errors running eslint:\n' + e.message
    final_msg += '\neslint test finished at: ' + str(datetime.datetime.now())
    out_file = open('/vagrant/html/tests/test_results/' +
                    uuid_in + '_eslint_test.txt', 'w')
    out_file.write(final_msg)
    out_file.close()


def setup_specs(hosts, all_specs, uuid_in, spec_type):
    ret_specs = []
    spec_ips = get_hosts_ip_and_port(hosts)
    actual_specs = get_tests_by_type(all_specs, spec_type)
    for spec in actual_specs:
        for ip in spec_ips:
            updated_spec = replace_url_in_test(spec, ip)
            vm_hostname = get_hostname_by_ip(hosts, ip)
            updated_spec = replace_var_in_test(
                updated_spec, 'full_path', '{{hostname}}', vm_hostname)
            updated_spec = replace_var_in_test(
                updated_spec, 'full_path', '{{uuid}}', uuid_in)
            ret_specs.append(updated_spec)
    return ret_specs


def run_tests(test_specs, line_checks):
    try:
        my_options = Options()
        my_options.add_argument('--headless')
        my_options.add_argument('--window-size=1200x800')
        driver = webdriver.Chrome(
            chrome_options=my_options, executable_path='/usr/bin/chromedriver')
        for test in test_specs:
            print '[-] Getting url: ' + test['url']
            driver.get(test['url'])
            if test['wait_type'] == 'class':
                search_by = By.CLASS_NAME
            elif test['wait_type'] == 'id':
                search_by = By.ID
            try:
                WebDriverWait(driver, test['timeout']).until(
                    EC.presence_of_element_located(
                        (search_by, test['wait_text']))
                )
            except Exception as e:
                print '[!] There was a problem getting a screenshot:\n' + e
                return
            if line_checks is True:
                row_count = len(
                    driver.find_elements_by_css_selector('td[id*="_status"]'))
                correct_num_lines(row_count)
            driver.get_screenshot_as_file(test['full_path'])
            print '[+] Screenshot saved in: ' + test['full_path']
    except Exception as my_ex:
        print '[!] Something went wrong while running tests'
        raise my_ex
    finally:
        try:
            driver.quit()
        except Exception:
            pass


def load_ansible_inventory(path):
    # Load the Ansible inventory
    try:
        cur_inventory = yaml.load(open(path))
    except Exception as my_ex:
        print '[!] Error loading Ansible inventory file - Cannot continue'
        raise my_ex
    return cur_inventory


def load_test_spec_data(path):
    # Load the test spec JSON data
    try:
        all_test_specs = json.load(open(path))
    except Exception as my_ex:
        print '[!] Error loading screenshot test spec JSON data'
        raise my_ex
    return all_test_specs


inventory_path = '/vagrant/ansible/inventory/ansible_inventory.yml'
spec_data_path = '/vagrant/html/tests/test_spec_data.json'
cur_inventory = load_ansible_inventory(inventory_path)
cur_test_specs = load_test_spec_data(spec_data_path)
cur_hosts = get_hosts(cur_inventory)
# Get a uuid for this deployment
my_uuid = str(uuid.uuid4())

# Gather screens of all nodes to verify content is being served correctly
get_screenshots = setup_specs(cur_hosts, cur_test_specs, my_uuid, 'always')
print '[-] Getting screenshots of web application content'
run_tests(get_screenshots, True)

# If full_tests are enabled, run linting, unit and coverage
test_node = 'rproxy'
full_tests = get_node_var(test_node, 'full_tests', cur_inventory)
if full_tests is True:
    print '[+] Running full tests'
    # Run linting
    run_linting(my_uuid)
    # Setting the CHROME_BIN environment variable
    os.environ["CHROME_BIN"] = "/usr/bin/chromium-browser"
    # Get screenshots of unit tests from SpecRunner
    unit_hosts = get_hosts_by_node_name(cur_inventory, test_node)
    unit_specs = setup_specs(unit_hosts, cur_test_specs, my_uuid, 'unit')
    print '[-] Getting screenshot of unit tests'
    run_tests(unit_specs, False)
    # Run Karma to get unit test output and Istanbul coverage report
    run_karma()
else:
    print '[-] Full tests were not enabled in Ansible Inventory'
