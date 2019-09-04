const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv');
const fs = require('fs');
const cors = require('cors');
dotenv.config();


// db 
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, { 'useFindAndModify': false }, { 'useCreateIndex': true })
    .then(() => console.log('Db Connected'));
mongoose.connection.on('error', err => {
    console.log(`DB console error: ${err.message}`);
})


// init Middleware
app.use(express.json({ extended: false }));

// bring in the route
const postRoutes = require('./routes/post');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// api docs
app.get('/api', (req, res) => {
    fs.readFile('docs/apiDocs.json', (err, data) => {
        if (err) {
            res.status(400).json({
                error: err
            })
        }
        const docs = JSON.parse(data)
        res.json(docs);
    });
})

// middleware
app.use(morgan("dev"));
app.use(cookieParser())
app.use(cors());
app.use('/api', postRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ error: "Unauthorized" });
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => { console.log(`A node js API listening to port: ${port}`) });