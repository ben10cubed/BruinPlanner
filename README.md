# BruinPlanner

The purpose of this web-app is to provide UCLA students a more modern interface to:
   - Choose classes
   - Generate schedules based on available classes
   - Save the generated schedules for future use

## How to run BruinPlanner locally

First, clone the repository. 

After cloning, to prepare the web-app:
   1. Use cd to navigate to within BruinPlanner.

   2. Run npm install under both the /server and the /client directory
      This should install all the necessary libraries and dependencies.
   
   3. Using a terminal in VSCode, run node server.js under /server
      After a successful execution, an output similar to "Server running on port 3000" should appear.
      This initializes the backend that processes API requests.
      Make sure to have this terminal open.
   
   5. Open a new terminal, use cd to navigate, and run npm run dev under /client.
      This initializes the frontend where the user interface. The user should be able to register an account.
      After a successful execution, an output similar to "Local:   http://localhost:5173/" should appear.
      Due to limited time, user information is stored locally, so the same account will not work on a different device.

## How to run E2E tests
Directly under BruinPlanner folder:
1. Run npm install
2. Then run npx playwright tests
- Playwright will automatically start back/frontend
3. The E2E tests will test registration and class/subject searching
  - Schedule testing is slightly more complex
  - It depends on whether a class still has spots
  - More reliable to test by hand

## Diagrams:

### End-to-End Diagram:
![End-to-end](https://github.com/xavieryychan/BruinPlanner/blob/main/diagram1v5simple.png)

### Sequnece Diagram:
![Sequence](https://github.com/xavieryychan/BruinPlanner/blob/main/diagram2v4.svg)



