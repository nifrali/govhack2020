import json
from urllib import request
import pandas as pd
import urllib.parse as urlparse


def transformImg(x):
	print(x)
	if str(x) == "nan":
		return ""
	return x["url"]

def getCustomField(x, label):

	for val in x: 
		if val["label"] == label:
		    return val["value"]


#events_data = pd.read_json("brisbane-city-council.json")
events_data = pd.read_json("http://www.trumba.com/calendars/brisbane-city-council.json")
deals_data  = pd.read_json("https://www.data.qld.gov.au/datastore/dump/33159533-c2ee-4e11-902d-e2d250e2c84c?format=json")

df = pd.DataFrame(events_data)

df["eventImage"] = df.eventImage.apply(lambda x: transformImg(x))
df["eventVenueName"] = df.customFields.apply(lambda x: getCustomField(x, "Venue"))
df["eventVenuMapLink"] = df.customFields.apply(lambda x: getCustomField(x, "Venue address"))
df["eventType"] = df.customFields.apply(lambda x: getCustomField(x, "Event type"))
df["eventBookingSite"] = df.customFields.apply(lambda x: getCustomField(x, "Bookings"))
df["eventBookingRequired"] = df.customFields.apply(lambda x: getCustomField(x, "Bookings required"))

df = df.drop(["detailImage","customFields"],axis=1)


# Output in JSONL format
df.to_json("processed_events.json",orient='records', lines=True)
#print(df.to_json(orient='records', lines=True))
