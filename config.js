const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whynotDB';
const JWT_KEY = process.env.JWT_KEY || 'why-not';
const PORT = process.env.PORT || 3000;
const dbName = process.env.DBNAME || 'whynotDB';
const BASEAPPURL = process.env.BASEAPPURL || 'http://localhost:3000/';

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true);
    } else {
        cb(new Error('yes'), false);
    }
};

const upload = multer({storage, fileFilter});
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const validator = require("email-validator");

function dateNow() {
    var dateNow = new Date();
    var day = dateNow.getDate();
    var month = dateNow.getMonth();
    var year = dateNow.getFullYear();
    var hour = dateNow.getHours();
    var minutes = dateNow.getMinutes();
    var seconds = dateNow.getSeconds();
    month += 1;
    return formatDigits(day) + '/' + formatDigits(month) + '/' + year + ' ' + formatDigits(hour) + ':' + formatDigits(minutes) + ':' + formatDigits(seconds);
}

function formatDigits(number) {
    if (number < 10) {
        number = ('0' + number);
    }
    return number;
}

function isUsernameValid(str) {
    if (typeof (str) !== 'string') {
        return false;
    }
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 122 || str.charCodeAt(i) < 65) {
            if (str.charCodeAt(i) < 97 || str.charCodeAt(i) > 90) {
                return false;
            }
        }
    }
    return true;
}

module.exports = {
    ObjectId,
    MongoClient,
    MONGODB_URI,
    BASEAPPURL,
    dbName,
    JWT_KEY,
    PORT,
    jwt,
    md5,
    isUsernameValid,
    dateNow,
    validator,
    upload
};