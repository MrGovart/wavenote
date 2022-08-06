const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'audio', 'index.html'));
})

app.listen(port, () => {
    console.log(`Server running at port ${port}`)
    console.log(__dirname)
  })