###################################################
# About
#
# This script fill in gaps in a time series
###################################################

###################################################
# define metadata, resources, inputs and outputs

#wps.des: id = gap_filler, title = Gap Filler Tool,
# abstract = Fills in gaps in a time series;

#wps.in: id = resource_id, type = string, title = Time series to process,
# abstract = CUAHSI resource ID of the time series,
# minOccurs = 1, maxOccurs = 1;

#wps.in: id = fill_function, type = string, title = Type of filler function to use,
# abstract = Method to fill the gap in the time series either linear or spline,
# minOccurs = 1, maxOccurs = 1;

#wps.out: id = output, type = text, title = gap filled time series values,
# abstract = plot values of the gap filled time series;

######################################
# CUAHSI Gap Filler Tool          #
######################################
library(WaterML)
library(xts)
library(httr)
library(jsonlite)
#wps.off;
resource_id = "cuahsi-wdc-2016-04-20-57260727"
fill_function = 'linear'
#wps.on;

cuahsi_url = "http://qa-webclient-solr.azurewebsites.net/CUAHSI/HydroClient/WaterOneFlowArchive/"
url1 = paste0(cuahsi_url, resource_id, "/zip")

temp1 = tempfile()
tempdir1 = tempdir()
temp_unzip = tempfile()
GET(url1, write_disk(temp1, overwrite=TRUE))
waterml1 = unzip(temp1, exdir=tempdir1)
values1 = GetValues(waterml1)
plot(DataValue~time, data=values1, type="l")
unlink(temp1)
unlink(waterml1)
unlink(tempdir1)

#url <- 'http://hydrodata.info/chmi-h/cuahsi_1_1.asmx/GetValuesObject?location=CHMI-H:140&variable=CHMI-H:TEPLOTA&startDate=2015-07-01&endDate=2015-07-10&authToken='
#url<- 'http://hydrodata.info/chmi-h/cuahsi_1_1.asmx/GetValuesObject?location=CHMI-H:140&variable=CHMI-H:TEPLOTA&startDate=2015-07-01&endDate=2015-07-10&authToken='
#url <-'http://hydrodata.info/chmi-d/cuahsi_1_1.asmx/GetValuesObject?location=CHMI-D:171~variable!CHMI-D:PRUTOK~startDate!2014-07-01~endDate!2015-07-30~authToken!'
# server <- gsub("!", "=", url)
# server <- gsub("~", "&", server)
# values <- GetValues(server)
#get time series object

ts <- xts(values1$DataValue, order.by = values1$time)
#convert to weekly
plot(ts)
# date<- time(ts)
date1 = as.double(values1$DateTimeUTC)
time_conversion = -1*values1$UTCOffset*60*60+date1
# date<- as.Date(as.POSIXct(time(ts),format = "%Y-%m-%d %H:%M:%S%z"))
# value <- as.double(ts)
# data <- data.frame(date,value)
final <- xts(values1$DataValue, order.by = values1$time)
plot(final)

if(fill_function == "linear"){
  final_ts<-na.approx(final,na.rm =FALSE)
}
if(fill_function == "spline"){
  final_ts <- na.spline(final)
}

plot(final_ts)
# output <- "Modified Values"
# write.zoo(final_ts,output)
# plot(final_ts)
#plot(ts)
# write output data in JSON format
time_conversion = time_conversion*1000
output1 = data.frame(date=time_conversion,values = final_ts,row.names = NULL)

# remove 'no data' values from the output data

output_valid = output1[complete.cases(output1),]

# name of output data file
output = "output_data.json"
output_json = toJSON(list(data = setNames(output_valid, NULL)))
write(output_json, output)

