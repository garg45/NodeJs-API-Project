# NodeJs-API-Project
## API handle 20 request per minute for more read readme file
### Problem:
Create an API that can handle 20 request per minute and if request is lies in between 20 and 40 then 
response to these request with some delay in such a way that API handle 20 request per minute and 
request if request more than 40 then show server is busy for external API you can use any open API's.

### Solution:
I have used weather API to fetch the data and showing weather of particular city .

I have used bottleneck npmm library , redis as a cache 

#### Logic:
when request is <= 40
const limiter = new Bottleneck({
  reservoir: 20, // initial value
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 60 * 1000, // must be divisible by 250

  maxConcurrent: 1,
  minTime: 500
});
reservoir is a counter decremented every time a job is launched, we set its initial value to 20. Then, every reservoirRefreshInterval (60000 ms), 
reservoir is automatically updated to be equal to the reservoirRefreshAmount (20).
and then call schedule() {schedule() returns a promise that will be executed according to the rate limits} for more detail go to code i.e(app.js file)

when request is >40:
send "Server is busy" for more detail go to code i.e(app.js file)




