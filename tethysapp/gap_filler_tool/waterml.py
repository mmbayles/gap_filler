from lxml import etree
import numpy
import requests

from datetime import datetime
from datetime import timedelta
from dateutil import parser
from django.http import HttpResponse

from .app import GapFillerTool
import csv
import zipfile
import time
import os

#drew 20150401 convert date string into datetime obj
def time_str_to_datetime(t):
    try:
        t_datetime=parser.parse(t)
        return t_datetime
    except ValueError:
        print "time_str_to_datetime error: "+ t
        raise Exception("time_str_to_datetime error: "+ t)
        return datetime.now()


#drew 20150401 convert datetime obj into decimal second (epoch second)
def time_to_int(t):
    try:
        d=parser.parse(t)
        t_sec_str=d.strftime('%s')
        return int(t_sec_str)
    except ValueError:
        print ("time_to_int error: "+ t)
        raise Exception('time_to_int error: ' + t)


def get_version(root):
    wml_version = None
    for element in root.iter():
        if '{http://www.opengis.net/waterml/2.0}Collection' in element.tag:
            wml_version = '2.0'
            break
        if '{http://www.cuahsi.org/waterML/1.1/}timeSeriesResponse' \
        or '{http://www.cuahsi.org/waterML/1.0/}timeSeriesResponse' in element.tag:
            wml_version = '1'
            break
    return wml_version


def parse_1_0_and_1_1(root, metadata_only=False):
    print "running parse_1_0_and_1_1"
    root_tag = root.tag.lower()
    print "root tag: " + root_tag

    try:
        if 'timeseriesresponse' in root_tag or 'timeseries' in root_tag or "envelope" in root_tag:

            # lists to store the time-series data
            for_graph = []
            boxplot = []
            for_highchart = []
            my_times = []
            my_values = []
            nodata = "-9999"  # default NoData value. The actual NoData value is read from the XML noDataValue tag
            timeunit=None
            sourcedescription = None
            timesupport =None
            # metadata items
            units, site_name, variable_name,quality,method, organization = None, None, None, None, None, None
            unit_is_set = False
            datatype = None
            valuetype = None
            samplemedium = None
            smallest_value = 0
            # iterate through xml document and read all values
            for element in root.iter():

                bracket_lock = -1
                if '}' in element.tag:
                    bracket_lock = element.tag.index('}')  # The namespace in the tag is enclosed in {}.
                    tag = element.tag[bracket_lock+1:]     # Takes only actual tag, no namespace

                if 'value' == tag:
                    my_times.append(element.attrib['dateTime'])
                    my_values.append(element.text)
                else:
                    # in the xml there is a unit for the value, then for time. just take the first
                    if 'unitName' == tag:
                        if not unit_is_set:
                            units = element.text
                            unit_is_set = True
                    if 'noDataValue' == tag:
                        nodata = element.text
                    if 'siteName' == tag:
                        site_name = element.text
                    if 'variableName' == tag:
                        variable_name = element.text
                    if 'organization'==tag:
                        organization = element.text
                    if 'definition' == tag:
                        quality = element.text
                    if 'methodDescription' == tag:
                        method = element.text
                    if 'dataType' == tag:
                        datatype = element.text
                    if 'valueType' == tag:
                        valuetype = element.text
                    if "sampleMedium" == tag:
                        samplemedium = element.text
                    if "timeSupport"== tag:
                        timesupport =element.text
                    if"unitName"== tag:
                        timeunit =element.text
                    if"sourceDescription"== tag:
                        sourcedescription =element.text

            # Measuring the WaterML processing time ...
            t0 = time.time()

            for  v in range(0, len(my_values)):
                if v >= smallest_value:
                    smallest_value = v

            for i in range(0, len(my_values)):

                # parse date and time
                #t = dateutil.parser.parse(my_times[i], ignoretz=True)

                # formatting time for HighCharts (milliseconds since Jan1 1970)
                #t = int((t - datetime(1970, 1, 1)).total_seconds() * 1000)

                if metadata_only == False:
                    t = time.mktime(time.strptime(my_times[i],'%Y-%m-%dT%H:%M:%S'))

                # check to see if there are null values in the time series
                if my_values[i] == nodata:
                    if metadata_only == False:
                        for_highchart.append([t, None])
                else:
                    for_graph.append(float(my_values[i]))
                    if metadata_only == False:
                        for_highchart.append([t, float(my_values[i])])

            value_count = len(for_graph)
            if metadata_only == False:
                smallest_time = for_highchart[0][0]
                largest_time = for_highchart[value_count - 1][0]
            else:
                smallest_time = 0
                largest_time = 0

            value_count = len(my_values)


            # End of measuring the WaterML processing time...
            print "convert time time: " + str(time.time() - t0)

            mean = numpy.mean(for_graph)
            mean = float(format(mean, '.2f'))
            median = float(format(numpy.median(for_graph), '.2f'))
            quar1 = float(format(numpy.percentile(for_graph,25), '.2f'))
            quar3 = float(format(numpy.percentile(for_graph,75), '.2f'))
            min1 = float(format(min(for_graph), '.2f'))
            max1 = float(format(max(for_graph), '.2f'))
            boxplot.append(1)
            boxplot.append(min1)#adding data for the boxplot
            boxplot.append(quar1)
            boxplot.append(median)
            boxplot.append(quar3)
            boxplot.append(max1)
            #boxplot ="hi"
            sd = numpy.std(for_graph)

            return {
                'site_name': site_name,
                'start_date': str(smallest_time),
                'end_date': str(largest_time),
                'variable_name': variable_name,
                'units': units,
                'wml_version': '1',
                'for_highchart': for_highchart,
                'mean': mean,
                'median': median,
                'stdev': sd,
                'count': value_count,
                'organization': organization,
                'quality': quality,
                'method': method,
                'status': 'success',
                'datatype' :datatype,
                'valuetype' :valuetype,
                'samplemedium':samplemedium,
                'smallest_value':smallest_value,
                'timeunit':timeunit,
                'sourcedescription' :sourcedescription,
                'timesupport' : timesupport,
                'boxplot':boxplot
            }
        else:
            parse_error = "Parsing error: The WaterML document doesn't appear to be a WaterML 1.0/1.1 time series"
            print parse_error
            return {
                'status': parse_error
            }
    except Exception, e:
        data_error = "Parsing error: The Data in the Url, or in the request, was not correctly formatted for water ml 1."
        print data_error
        print e
        return {
            'status': data_error
        }


def parse_2_0(root):
    print "running parse_2"
    try:
        if 'Collection' in root.tag:
            ts = etree.tostring(root)
            keys = []
            vals = []
            for_graph = []
            for_highchart=[]
            units, site_name, variable_name, latitude, longitude, method = None, None, None, None, None, None
            name_is_set = False
            variable_name = root[1].text
            organization = None
            quality = None
            method =None
            datatype = None
            valuetype = None
            samplemedium = None
            timeunit=None
            sourcedescription = None
            timesupport =None
            smallest_value = 0
            for element in root.iter():
                if 'MeasurementTVP' in element.tag:
                        for e in element:
                            if 'time' in e.tag:
                                keys.append(e.text)
                            if 'value' in e.tag:
                                vals.append(e.text)
                if 'uom' in element.tag:
                    units = element.text
                if 'MonitoringPoint' in element.tag:
                    for e in element.iter():
                        if 'name' in e.tag and not name_is_set:
                            site_name = e.text
                            name_is_set = True
                        if 'pos' in e.tag:
                            lat_long = e.text
                            lat_long = lat_long.split(' ')
                            latitude = lat_long[0]
                            longitude = lat_long[1]
                if 'observedProperty' in element.tag:
                    for a in element.attrib:
                        if 'title' in a:
                            variable_name = element.attrib[a]
                if 'ObservationProcess' in element.tag:
                    for e in element.iter():
                        if 'processType' in e.tag:
                            for a in e.attrib:
                                if 'title' in a:
                                    method=e.attrib[a]

                if 'organization' in element.tag:
                    organization = element.text

                if 'definition' in element.tag:
                    quality = element.text
                    print "the quality"+quality
                if 'methodDescription' in element.tag:
                    method = element.text
                if 'dataType' in element.tag:
                    datatype = element.text
                if 'valueType' in element.tag:
                    valuetype = element.text
                if "sampleMedium" in element.tag:
                    samplemedium = element.text
                if"timeSupport"in element.text:
                    timesupport =element.text
                if"unitName"in element.text:
                    timeunit =element.text
                if"sourceDescription"in element.text:
                    sourcedescription =element.text

            for i in range(0,len(keys)):
                time_str=keys[i]
                time_obj=time_str_to_datetime(time_str)

                if vals[i] == "-9999.0"or vals[i]=="-9999":
                    val_obj = None
                else:
                    val_obj=float(vals[i])

                item=[time_obj,val_obj]
                for_highchart.append(item)
            values = dict(zip(keys, vals))

            for k, v in values.items():
                t = time_to_int(k)
                for_graph.append({'x': t, 'y': float(v)})
            smallest_time = list(values.keys())[0]
            largest_time = list(values.keys())[0]
            for t in list(values.keys()):
                if t < smallest_time:
                    smallest_time = t
                if t> largest_time:
                    largest_time = t
            for v in list(values.vals()):
                if v < smallest_value:
                    smallest_value = t

            return {'time_series': ts,
                    'site_name': site_name,
                    'start_date': smallest_time,
                    'end_date':largest_time,
                    'variable_name': variable_name,
                    'units': units,
                    'values': values,
                    'wml_version': '2.0',
                    'latitude': latitude,
                    'longitude': longitude,
                    'for_highchart': for_highchart,
                    'organization':organization,
                    'quality':quality,
                    'method':method,
                    'status': 'success',
                    'datatype' :datatype,
                    'valuetype' :valuetype,
                    'samplemedium':samplemedium,
                    'smallest_value':smallest_value,
                    'timeunit':timeunit,
                    'sourcedescription' :sourcedescription,
                    'timesupport' : timesupport,
                    'values':vals
                    }
        else:
            print "Parsing error: The waterml document doesn't appear to be a WaterML 2.0 time series"
            return "Parsing error: The waterml document doesn't appear to be a WaterML 2.0 time series"
    except:
        print "Parsing error: The Data in the Url, or in the request, was not correctly formatted."
        return "Parsing error: The Data in the Url, or in the request, was not correctly formatted."


def parse(xml_file, metadata_only):
    try:
        tree = etree.parse(xml_file)
        root = tree.getroot()

        wml_version = get_version(root)
        if wml_version == '1':
            return parse_1_0_and_1_1(root, metadata_only)
        elif wml_version == '2.0':
            return parse_2_0(root)
    except ValueError, e:
        return read_error_file(xml_file)
    except:
        return read_error_file(xml_file)


def read_error_file(xml_file):
    try:
        f = open(xml_file)
        return {'status': f.readline()}
    except:
        return {'status': 'invalid WaterML file'}