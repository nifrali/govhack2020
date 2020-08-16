const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment');
const {Card,Text, Suggestion} = require('dialogflow-fulfillment');
const {BigQuery} = require('@google-cloud/bigquery');
const { DateTime } = require('actions-on-google');
const bigquery = new BigQuery();

async function query(entity) {
  // Queries events
  const query_events = `SELECT startDateTime,eventType, title, location, eventImage, eventVenuMapLink
    FROM \`digimatiks.GovHack2020.brisbane_events_view_table\`
    LIMIT 5`;
  const query_deals = `SELECT Trading_Name, Outlet_Name, Outlet_Address, Outlet_Suburb, Telephone_Number,Discount,Business_Category,Website
  FROM \`digimatiks.GovHack2020.GovHack2020.business_discount_directory\`
  WHERE Outlet_Address like \"%Brisbane%\" and Business_Category in (
  \"Restaurants and Dining Out\",\"Accomodation\",\"Cafes\",\"Gifts and Homewares\",\"Clubs, Hotels and Taverns\",\"Gourmet and Specialty Items\",\"Takeawa\y")
  LIMIT 5`;
  var query = query_events
  if (entity == "deals") {
     query = query_deals
  }
  // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
  const options = {
    query: query,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'australia-southeast1',
  };
  // Run the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  // Print the results
  console.log('Rows:');
  rows.forEach(row => console.log(row));

  return rows
}
function getDateString(dt){
  new_dt = new Date( Date.parse(dt));
  return new_dt.toLocaleString();
}
function createCard(event) {
  return new Card({
    title: event.title,
  imageUrl: event.eventImage,
  text: event.eventType + " on " + getDateString(event.startDateTime) + " at " + event.location,
    buttonText: 'Check location',
  buttonUrl: event.eventVenuMapLink
  })
}

const app = express()
app.get('/', (req, res) => res.send('online'))
app.post('/dialogflow', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })
  var events = []
  var deals  = []
  function welcome(agent) {
    agent.add(`Hi, I am your MyQueensland assistant, how can I help?`);
  }

  function searchEventHandler(agent) {
    events = query("events");
    agent.add(`Here's what I found..`);
    var event =  events[Math.floor(Math.random() * events.length)];
    agent.add(event.title + " on " + getDateString(event.startDateTime) + " at " + event.location ),
    agent.add(createCard(event));
    agent.add(`Thanks`);
    //  agent.setFollowupEvent("ask-deals");
    //  agent.context.set("show-deals", 1, null);
    //agent.add(`I can't find interesting events right now...`);
  }

  function askDealsHandler(agent) {
    agent.add(`Do you want to know deals or discounts from local shops as well?`);
    agent.add(new Suggestion(`Yes!`));
    agent.add(new Suggestion(`No`));
  }

  function showDealsHandler(agent) {
    cost [deals]=  query("deals");
    agent.add(`Great! searching for deals now!`);
    var deal =  deals[Math.floor(Math.random() * deals.length)];
    var msg = deal.Discount;
    msg += deal.Outlet_Name;
    msg += " at "
    msg += deal.Outlet_Address;
    agent.add(msg);
    agent.add(new Card({
        title: deal.Discount,
        subtitle: deal.Trading_Name,
        text: deal.Trading_Name + 'at \n' + deal.Outlet_Address +'\n',
        buttons: [
         {
            "text" : deal.Website,
            "postback": deal.Website
         }
        ]
       })
    );

  }

  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  intentMap.set('search-event', searchEventHandler);
  intentMap.set('ask-for-deals', askDealsHandler);
  intentMap.set('show-deals-answer', showDealsHandler);
  agent.handleRequest(intentMap)
})


module.exports = app
