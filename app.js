const express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    trilhasRoutes = require('./carga-trilhas.routes'),
    app = express();

var session = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'));

app.use(trilhasRoutes);

app.listen(3000, () => console.log('app listen on port 3000...'));