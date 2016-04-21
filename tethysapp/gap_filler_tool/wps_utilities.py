import requests
from django.http import JsonResponse
from django.http import HttpResponse
from owslib.etree import etree
from owslib.wps import WebProcessingService
from owslib.wps import monitorExecution
from owslib.wps import WPSExecution
from app import GapFillerTool

def run_wps(res_ids,gap):

    if (gap ==''):
        gap = "linear"

    # checks if there is two resource IDs
    resources = res_ids.split("_")
    print gap
    print "888888888888888888888888888888888888888888888888888888"
    process_id = 'org.n52.wps.server.r.gap_filler'
    process_input = [('resource_id',str(resources[0])),('fill_function',str(gap))]

    #setting the WPS URL is set in app.py
    url_wps = GapFillerTool.wps_url + '/WebProcessingService'

    my_engine = WebProcessingService(url_wps, verbose=False, skip_caps=True)
    my_process = my_engine.describeprocess(process_id)

    #executing the process..
    # build execution
    execution = WPSExecution(version=my_engine.version, url=my_engine.url, username=my_engine.username,
                             password=my_engine.password, verbose=my_engine.verbose)
    requestElement = execution.buildRequest(process_id, process_input, 'output')
    request = etree.tostring(requestElement)
    #set store executeresponse to false
    request = request.replace('storeExecuteResponse="true"', 'storeExecuteResponse="false"')
    print request

    execution = my_engine.execute(process_id, process_input, 'output', request)

    monitorExecution(execution)
    status = execution.status
    print status

    # if the status is successful...
    if status == 'ProcessSucceeded':
        outputs = execution.processOutputs
        output0 = outputs[0]
        reference0 = output0.reference

        # retrieve the data from the reference
        output_data = requests.get(reference0)
        resp = HttpResponse(output_data, content_type="application/json")
        return resp

    else:
        return JsonResponse({'status': 'wps request failed'})