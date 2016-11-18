from django.http import JsonResponse
from django.http import HttpResponse
from django.shortcuts import render
from wsgiref.util import FileWrapper
import os
from datetime import datetime
import utilities
import requests
import tempfile
from app import GapFillerTool
import utilities
import waterml
import wps_utilities
# -- coding: utf-8--

# helper controller for fetching the WaterML file
def temp_waterml(request, id):
    base_path = utilities.get_workspace()+"/id"
    file_path = base_path + "/" +id
    response = HttpResponse(FileWrapper(open(file_path)), content_type='application/xml')

    print datetime.now()
    return response


# formats the time series for highcharts
def chart_data(request, res_id):

    # checks if we already have an unzipped xml file
    file_path = utilities.waterml_file_path(res_id)
    # if we don't have the xml file, downloads and unzips it
    if not os.path.exists(file_path):
        utilities.unzip_waterml(request, res_id)

    # returns an error message if the unzip_waterml failed
    if not os.path.exists(file_path):
        data_for_chart = {'status': 'Resource file not found'}
    else:
        # parses the WaterML to a chart data object
        data_for_chart = utilities.Original_Checker(file_path)
    return JsonResponse(data_for_chart)

# home page controller
def home(request):

    print datetime.now()
    ids=[]
    meta =[]
    source=[]

    quality=[]
    method=[]
    sourceid=[]
    data = request.META['QUERY_STRING']
    data = data.encode(encoding ='UTF-8')
    print data
    data  =data.split('&')
    for e in data:
        s= e.split('=')
        meta.append(s)
    print data
    print meta
    for e in meta:
        print e[0]
        if e[0] == 'Source':
            source.append(e[1])
        if e[0] == 'WofUri':
            ids.append(e[1])
        if e[0] == 'QCLID':
            quality.append(e[1])
        if e[0] == 'MethodId':
            method.append(e[1])
        if e[0] == 'SourceId':
            sourceid.append(e[1])






    context = {'source':source,
               'cuahsi_ids':ids,
               'quality':quality,
               'method':method,
               'sourceid':sourceid}
    return render(request, 'gap_filler_tool/home.html', context)
def r_script(request, res_ids):

    # needs error handling if number of resource IDs is not equal to two
    resources = res_ids.split("_")

    wps_url = GapFillerTool.wps_url
    script_url = wps_url + 'R/scripts/' + 'TimeSeriesGapFiller.r'
    print script_url
    output_data = requests.get(script_url)
    output_text = output_data.content

    # replace the resource_IDs in the script
    output_text = output_text.replace('cuahsi-wdc-2016-07-20-65435078', resources[0])


    resp = HttpResponse(output_text, content_type="text/plain; charset=utf-8")
    return resp
def wps(request, res_ids,gap):

    return wps_utilities.run_wps(res_ids,gap)
def gap_function(request,res_ids):

    return (res_ids)