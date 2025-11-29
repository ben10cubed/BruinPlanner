# BruinPlanner, subjectID-api

1. Moved ALL get files from src to client/src (importing issue in App.jsx).
2. created a new file server.js that handles the getSubjectID function
   - Server-side logic to scrape the official UCLA SOC API using fetchSubjectID
3. the actual getSubject is modified so it fetches the api instead of handling the actual fetching
4. removed the "default" timetable, now only generates when the class is selected

TODO:
Sort out the different package.json files.
Get frontend to call backend APIs.

To run:

start server

cd ~/BruinPlanner/server
node server.js

on one terminal window,

and 

run frontend

cd ~/BruinPlanner/client
npm run dev

on another.


