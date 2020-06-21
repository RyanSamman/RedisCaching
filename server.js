const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const app = express();

let redisClient = redis.createClient();

redisClient.on("error", (error) => {
    console.error(error);
})

function getCache(req, res, next) {
    redisClient.get(req.params.user, (err, data) => {
        if (err || !data) return next();
        console.log('Getting data from cache')
        res.json(JSON.parse(data));
    })
}

app.get('/github/:user', getCache, async (req, res) => {
    console.log('requesting data');
    let response = await fetch(`https://api.github.com/users/${req.params.user}`);
    let status = response.status;
    let data = await response.json();
    if (status !== 200) return res.status(500).json(data);
    // Caches data for 30 minutes
    redisClient.set(req.params.user, JSON.stringify(data), 'EX', 60*30, (err) => {
        if (err) console.log(err);
    });
    res.json(data);
});

app.listen(2000, () => console.log('Hosting on port 2000'));