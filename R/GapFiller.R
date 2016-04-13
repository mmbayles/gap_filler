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

#wps.out: id = output, type = text, title = gap filled time series values,
# abstract = plot values of the gap filled time series;

######################################
# CUAHSI Gap Filler Tool          #
######################################
library(WaterML)
library(xts)
library(httr)
library(jsonlite)
# resource_id = "cuahsi-wdc-2016-04-13-68259024"
cuahsi_url = "http://bcc-hiswebclient.azurewebsites.net/CUAHSI/HydroClient/WaterOneFlowArchive/"
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

# date<- time(ts)
date1 = as.double(values1$DateTimeUTC)
date<- as.Date(as.POSIXlt(time(ts)))
value <- as.double(ts)
data <- data.frame(date,value)
final <- xts(data$value, order.by = date)
plot(final)
final_ts<-final
final_ts<-na.approx(final)
plot(final_ts)
# output <- "Modified Values"
# write.zoo(final_ts,output)
# plot(final_ts)
#plot(ts)
# write output data in JSON format
date1 = date1*1000
output1 = data.frame(date=date1,values = final_ts,row.names = NULL)

# remove 'no data' values from the output data

output_valid = output1[complete.cases(output1),]

# name of output data file
output = "output_data.json"
output_json = toJSON(list(data = setNames(output_valid, NULL)))
write(output_json, output)
