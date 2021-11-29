const axios = require('axios')


async function get(q) {
   const {data} = await axios({
        method: "GET",
        url: `https://api.seniverse.com/v3/weather/now.json?key=S8iUfojW28_QulLmE&location=${q}&language=zh-Hans&unit=c`,
   })
    
    console.log(JSON.stringify(data));
}
   

get('新余')