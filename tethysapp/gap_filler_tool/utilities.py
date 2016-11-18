from lxml import etree
import numpy
import requests
import time
from datetime import timedelta
from dateutil import parser
from django.http import HttpResponse

from .app import GapFillerTool
import csv
import zipfile
import StringIO
import time
import zipfile
import os
import dateutil.parser
import collections
from datetime import datetime


def get_app_base_uri(request):
    base_url = request.build_absolute_uri()
    if "?" in base_url:
        base_url = base_url.split("?")[0]
    return base_url


def get_workspace():
    return GapFillerTool.get_app_workspace().path
    # return app.get_app_workspace().path


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


# drew 20150401 convert date string into datetime obj
def time_str_to_datetime(t):
    try:
        t_datetime = parser.parse(t)
        return t_datetime
    except ValueError:
        print "time_str_to_datetime error: " + t
        raise Exception("time_str_to_datetime error: " + t)
        return datetime.now()


# drew 20150401 convert datetime obj into decimal second (epoch second)
def time_to_int(t):
    try:
        d = parser.parse(t)
        t_sec_str = d.strftime('%s')
        return int(t_sec_str)
    except ValueError:
        print ("time_to_int error: " + t)
        raise Exception('time_to_int error: ' + t)


def parse_1_0_and_1_1(root):
    print "running parse_1_0_and_1_1"
    root_tag = root.tag.lower()
    print "root tag: " + root_tag


    # we only display the first 50000 values
    threshold = 50000000
    try:
        if 'timeseriesresponse' in root_tag or 'timeseries' in root_tag or "envelope" in root_tag:

            # lists to store the time-series data
            for_graph = []
            boxplot = []
            for_highchart = []

            my_times = []
            my_values = []
            master_values=collections.OrderedDict()
            master_times = collections.OrderedDict()
            master_boxplot = collections.OrderedDict()
            master_stat = collections.OrderedDict()
            master_data_values = collections.OrderedDict()
            master_counter = True
            meth_qual = [] # List of all the quality, method, and source combinations
            for_canvas = []
            meta_dic ={'method':{},'quality':{},'source':{},'organization':{},'quality_code':{}}
            m_des = None
            m_code = None
            m_org =None
            nodata = "-9999"  # default NoData value. The actual NoData value is read from the XML noDataValue tag
            timeunit = None
            sourcedescription = None
            timesupport = None
            # metadata items
            units, site_name, variable_name, quality, method, organization = None, None, None, None, None, None
            unit_is_set = False
            datatype = None
            valuetype = None
            samplemedium = None
            smallest_value = 0
            # iterate through xml document and read all values
            print "xml parse***********************************************888"
            print datetime.now()
            x = 'x'
            y = 'y'
            x_value = []
            y_value = []

            for element in root.iter():

                bracket_lock = -1
                if '}' in element.tag:
                    bracket_lock = element.tag.index('}')  # The namespace in the tag is enclosed in {}.
                    tag = element.tag[bracket_lock + 1:]  # Takes only actual tag, no namespace
                    if 'value' != tag:
                        # in the xml there is a unit for the value, then for time. just take the first

                        if 'unitName' == tag or 'units' == tag or 'UnitName' == tag or 'unitCode' == tag:
                            if not unit_is_set:
                                units = element.text
                                unit_is_set = True
                        if 'noDataValue' == tag:
                            nodata = element.text
                        if 'siteName' == tag:
                            site_name = element.text
                        if 'variableName' == tag:
                            variable_name = element.text
                        if 'organization' == tag or 'Organization' == tag or 'siteCode' == tag:
                            try:
                                organization = element.attrib['agencyCode']
                            except:
                                organization = element.text
                        if 'definition' == tag or 'qualifierDescription' == tag:
                            quality = element.text
                        if 'methodDescription' == tag or 'MethodDescription' == tag:
                            method = element.text
                        if 'dataType' == tag:
                            datatype = element.text
                        if 'valueType' == tag:
                            valuetype = element.text
                        if "sampleMedium" == tag:
                            samplemedium = element.text
                        if "timeSupport" == tag or "timeInterval" == tag:
                            timesupport = element.text
                        if "unitName" == tag or "UnitName" == tag:
                            timeunit = element.text
                        if "sourceDescription" == tag or "SourceDescription" == tag:
                            sourcedescription = element.text
                        if "method" ==tag.lower():
                            try:
                                mid = element.attrib['methodID']
                            except:
                                mid =None
                                m_code =''
                            for subele in element:
                                bracket_lock = subele.tag.index('}')  # The namespace in the tag is enclosed in {}.
                                tag1 = element.tag[bracket_lock+1:]
                                # Takes only actual tag, no namespace
                                if 'methodcode' in subele.tag.lower() and m_code=='':
                                    m_code = subele.text
                                    m_code = m_code.replace(" ","")

                                if mid != None:
                                    m_code = element.attrib['methodID']
                                    m_code = m_code.replace(" ","")
                                if 'methoddescription' in subele.tag.lower():
                                    m_des = subele.text

                            meta_dic['method'].update({m_code:m_des})
                        if "source" ==tag.lower():

                            try:
                                sid = element.attrib['sourceID']
                            except:
                                sid = None
                                m_code =''

                            for subele in element:
                                bracket_lock = subele.tag.index('}')  # The namespace in the tag is enclosed in {}.
                                tag1 = element.tag[bracket_lock+1:]

                                # Takes only actual tag, no namespace
                                if 'sourcecode' in subele.tag.lower() and m_code =='':
                                    m_code = subele.text
                                    m_code = m_code.replace(" ","")


                                if sid!= None:
                                    m_code = element.attrib['sourceID']
                                    m_code = m_code.replace(" ","")
                                if 'sourcedescription' in subele.tag.lower():
                                    m_des = subele.text
                                if 'organization' in subele.tag.lower():
                                    m_org = subele.text

                            meta_dic['source'].update({m_code:m_des})
                            meta_dic['organization'].update({m_code:m_org})


                        if "qualitycontrollevel" ==tag.lower():
                            try:
                                qlc= element.attrib['qualityControlLevelID']
                            except:
                                qlc =None
                                m_code =''

                            for subele in element:
                                bracket_lock = subele.tag.index('}')  # The namespace in the tag is enclosed in {}.
                                tag1 = element.tag[bracket_lock+1:]
                                # Takes only actual tag, no namespace

                                if  qlc !=None:
                                    m_code =element.attrib['qualityControlLevelID']
                                    m_code = m_code.replace(" ","")
                                if 'qualitycontrollevelcode' in subele.tag.lower():
                                    m_code1 = subele.text
                                    m_code1 = m_code1.replace(" ","")
                                if 'qualitycontrollevelcode' in subele.tag.lower() and m_code =='':
                                    m_code = subele.text
                                    m_code = m_code1.replace(" ","")
                                if 'definition' in subele.tag.lower():
                                    m_des = subele.text
                            meta_dic['quality'].update({m_code:m_des})
                            meta_dic['quality_code'].update({m_code1:m_code})
                        # print meta_dic

                    elif 'value' == tag:

                        try:
                            n = element.attrib['dateTimeUTC']
                        except:
                            n =element.attrib['dateTime']

                        try:
                            quality= element.attrib['qualityControlLevelCode']
                        except:
                            quality =''
                        try:
                            quality1 = element.attrib['qualityControlLevel']
                        except:
                            quality1 =''
                        if quality =='' and quality1 != '':
                            quality = quality1

                        try:
                            method = element.attrib['methodCode']
                        except:
                            method=''
                        try:
                            method1 = element.attrib['methodID']
                        except:
                            method1=''
                        if method =='' and method1 != '':
                                method = method1

                        try:
                            source = element.attrib['sourceCode']
                        except:
                            source=''
                        try:
                            source1 = element.attrib['sourceID']
                        except:
                            source1=''
                        if source =='' and source1 != '':
                            source = source1
                        dic = 'aa'+'aa'
                        # dic = quality +'aa'+method+'aa'+source
                        dic = dic.replace(" ","")


                        if dic not in meth_qual:

                            meth_qual.append(dic)
                            master_values.update({dic:[]})
                            master_times.update({dic:[]})
                            master_boxplot.update({dic:[]})
                            master_stat.update({dic:[]})
                            master_data_values.update({dic:[]})

                        v = element.text
                        if v == nodata:
                            value = None
                            x_value.append(n)
                            y_value.append(value)
                            v =None

                        else:
                            v = float(element.text)
                            x_value.append(n)
                            y_value.append(v)
                            master_data_values[dic].append(v) #records only none null values for running statistics
                        master_values[dic].append(v)
                        master_times[dic].append(n)
            for item in master_data_values:
                if len(master_data_values[item]) ==0:
                    mean = None
                    median =None
                    quar1 = None
                    quar3 = None
                    min1 = None
                    max1=None
                else:
                    mean = numpy.mean(master_data_values[item])
                    mean = float(format(mean, '.2f'))
                    median = float(format(numpy.median(master_data_values[item]), '.2f'))
                    quar1 = float(format(numpy.percentile(master_data_values[item],25), '.2f'))
                    quar3 = float(format(numpy.percentile(master_data_values[item],75), '.2f'))
                    min1 = float(format(min(master_data_values[item]), '.2f'))
                    max1 = float(format(max(master_data_values[item]), '.2f'))
                master_stat[item].append(mean)
                master_stat[item].append(median)
                master_stat[item].append(max1)
                master_stat[item].append(min1)
                master_boxplot[item].append(1)
                master_boxplot[item].append(min1)#adding data for the boxplot
                master_boxplot[item].append(quar1)
                master_boxplot[item].append(median)
                master_boxplot[item].append(quar3)
                master_boxplot[item].append(max1)

            return {
                'site_name': site_name,
                'variable_name': variable_name,
                'units': units,
                'meta_dic':meta_dic,
                'for_canvas':for_canvas,
                'organization': organization,
                'quality': quality,
                'method': method,
                'status': 'success',
                'datatype' :datatype,
                'valuetype' :valuetype,
                'samplemedium':samplemedium,
                'timeunit':timeunit,
                'sourcedescription' :sourcedescription,
                'timesupport' : timesupport,
                'master_counter':master_counter,
                'boxplot':boxplot,
                'master_values':master_values,
                'master_times':master_times,
                'master_boxplot':master_boxplot,
                'master_stat':master_stat
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


def getResourceIDs(page_request):
    resource_string = page_request.GET['res_id']  # retrieves IDs from url
    resource_IDs = resource_string.split(',')  # splits IDs by commma
    return resource_IDs


def findZippedUrl(page_request, res_id):
    base_url = page_request.build_absolute_uri()
    if "?" in base_url:
        base_url = base_url.split("?")[0]
        zipped_url = base_url + "temp_waterml/" + res_id + ".xml"
        return zipped_url


def parse_2_0(root):
    print "running parse_2"
    try:
        if 'Collection' in root.tag:
            ts = etree.tostring(root)
            keys = []
            vals = []
            for_graph = []
            for_highchart = []
            units, site_name, variable_name, latitude, longitude, method = None, None, None, None, None, None
            name_is_set = False
            variable_name = root[1].text
            organization = None
            quality = None
            method = None
            datatype = None
            valuetype = None
            samplemedium = None
            timeunit = None
            sourcedescription = None
            timesupport = None
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
                                    method = e.attrib[a]

                if 'organization' in element.tag:
                    organization = element.text

                if 'definition' in element.tag:
                    quality = element.text
                    print "the quality" + quality
                if 'methodDescription' in element.tag:
                    method = element.text
                if 'dataType' in element.tag:
                    datatype = element.text
                if 'valueType' in element.tag:
                    valuetype = element.text
                if "sampleMedium" in element.tag:
                    samplemedium = element.text
                if "timeSupport" in element.text:
                    timesupport = element.text
                if "unitName" in element.text:
                    timeunit = element.text
                if "sourceDescription" in element.text:
                    sourcedescription = element.text

            for i in range(0, len(keys)):
                time_str = keys[i]
                time_obj = time_str_to_datetime(time_str)

                if vals[i] == "-9999.0" or vals[i] == "-9999":
                    val_obj = None
                else:
                    val_obj = float(vals[i])

                item = [time_obj, val_obj]
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
                if t > largest_time:
                    largest_time = t
            for v in list(values.vals()):
                if v < smallest_value:
                    smallest_value = t

            return {'time_series': ts,
                    'site_name': site_name,
                    'start_date': smallest_time,
                    'end_date': largest_time,
                    'variable_name': variable_name,
                    'units': units,
                    'values': values,
                    'wml_version': '2.0',
                    'latitude': latitude,
                    'longitude': longitude,
                    'for_highchart': for_highchart,
                    'organization': organization,
                    'quality': quality,
                    'method': method,
                    'status': 'success',
                    'datatype': datatype,
                    'valuetype': valuetype,
                    'samplemedium': samplemedium,
                    'smallest_value': smallest_value,
                    'timeunit': timeunit,
                    'sourcedescription': sourcedescription,
                    'timesupport': timesupport,
                    'values': vals
                    }
        else:
            print "Parsing error: The waterml document doesn't appear to be a WaterML 2.0 time series"
            return "Parsing error: The waterml document doesn't appear to be a WaterML 2.0 time series"
    except:
        print "Parsing error: The Data in the Url, or in the request, was not correctly formatted."
        return "Parsing error: The Data in the Url, or in the request, was not correctly formatted."


def Original_Checker(xml_file):
    print "original checker start***************************"
    print datetime.now()

    try:
        tree = etree.parse(xml_file)
        root = tree.getroot()
        wml_version = get_version(root)
        if wml_version == '1':
            return parse_1_0_and_1_1(root)
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


def unzip_waterml(request, res_id):
    # this is where we'll unzip the waterML file to
    waterml_url = None
    temp_dir = get_workspace()
    print temp_dir
    # get the URL of the remote zipped WaterML resource
    src = 'test'
    # print os.getcwd()
    if not os.path.exists(temp_dir + "/id"):
        os.makedirs(temp_dir + "/id")

    if 'cuahsi-wdc' in res_id:
        # url_zip = 'http://bcc-hiswebclient.azurewebsites.net/CUAHSI/HydroClient/WaterOneFlowArchive/'+res_id+'/zip'
        url_zip = 'http://qa-webclient-solr.azurewebsites.net/CUAHSI/HydroClient/WaterOneFlowArchive/' + res_id + '/zip'
        print url_zip
    elif 'hydroshare' in src:
        url_zip = 'https://www.hydroshare.org/hsapi/_internal/' + res_id + '/download-refts-bag/'
        # hs = HydroShare()
    else:
        url_zip = 'http://' + request.META['HTTP_HOST'] + '/apps/data-cart/showfile/' + res_id
    r = requests.get(url_zip, verify=False)
    try:
        z = zipfile.ZipFile(StringIO.StringIO(r.content))
        file_list = z.namelist()
        try:
            for file in file_list:
                if 'hydroshare' in src:
                    if 'wml_1_' in file:
                        file_data = z.read(file)
                        file_temp_name = temp_dir + '/id/' + res_id + '.xml'
                        file_temp = open(file_temp_name, 'wb')
                        file_temp.write(file_data)
                        file_temp.close()
                else:
                    file_data = z.read(file)
                    file_temp_name = temp_dir + '/id/' + res_id + '.xml'
                    file_temp = open(file_temp_name, 'wb')
                    file_temp.write(file_data)
                    file_temp.close()
                    # getting the URL of the zip    file

        # error handling

        # checks to see if data is an xml
        except etree.XMLSyntaxError as e:
            print "Error:Not XML"
            return False

        # checks to see if Url is valid
        except ValueError, e:
            print "Error:invalid Url"
            return False

        # checks to see if xml is formatted correctly
        except TypeError, e:
            print "Error:string indices must be integers not str"
            return False

    # check if the zip file is valid
    except zipfile.BadZipfile as e:
        error_message = "Bad Zip File"
        print "Bad Zip file"
        return False

    # finally we return the waterml_url
    print "End of download***************************"
    print datetime.now()
    return waterml_url


# finds the waterML file path in the workspace folder
def waterml_file_path(res_id):
    base_path = get_workspace()
    file_path = base_path + "/id/" + res_id
    if not file_path.endswith('.xml'):
        file_path += '.xml'
    return file_path


def file_unzipper(url_cuashi):
    # this function is for unzipping files
    r = requests.get(url_cuashi)
    z = zipfile.ZipFile(StringIO.StringIO(r.content))
    file_list = z.namelist()
    for file in file_list:
        z.read(file)
    return file_list


def error_report(file):
    temp_dir = get_workspace()
    file_temp_name = temp_dir + '/error_report.txt'
    file_temp = open(file_temp_name, 'a')

    time = datetime.now()
    time2 = time.strftime('%Y-%m-%d %H:%M')
    print time2

    file_temp.write(time2 + "\n" + file + "\n")
    file_temp.close()
    file_temp.close()
