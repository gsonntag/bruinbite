const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.status(200)
    res.send('testing server')
})

app.listen(PORT, (error) => {
    if (error)
        console.log('Failed to start', error)
    else
        console.log(`Listening on port ${port}`)
});