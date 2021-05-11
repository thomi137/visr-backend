const express = require('express');
const fileUpload = require('express-fileupload');
const {Storage} = require('@google-cloud/storage');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const firebaseAdmin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(fileUpload({
    createParentPath: true
}));

app.use(express.static('uploads'));
//app.use('/', express.static(path.join(__dirname, 'public')));

/* const jwtCheck = jwt(
    secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    audience: process.env.AUTH0_API_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithm: 'RS256'
  }); */

const serviceAccount = require('./firebase/firebase-service-account.json');
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    storageBucket: 'visr-8d89f.appspot.com'
});

const bucket = firebaseAdmin.storage().bucket();

async function uploadFile(path, name) {
    return await bucket.upload(path, {
      destination: name,
    });
  
    console.log(`${filePath} uploaded to ${bucket}`);
}


// Routes

app.get('/firebase', async (req, res) => {
const {sub: uid} = req.user;

try {
    const firebaseToken = await firebaseAdmin.auth().createCustomToken(uid);
    res.json({firebaseToken});
} catch (err) {
    res.status(500).send({
    message: 'Something went wrong acquiring a Firebase token.',
    error: err
    });
}
});

app.get('/ping', async (req, res) => {
    res.json('pong');
});

app.post('/upload', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "file") to retrieve the uploaded file
            let file = req.files.file;
            console.log(file)
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            file.mv('./uploads/' + file.name);

            uploadRes = await uploadFile(`./uploads/${file.name}`, file.name);

            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: file.name,
                    mimetype: file.mimetype,
                    size: file.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

const PORT = process.env.PORT || 3003
  
app.listen(PORT, () => console.log('Server running on ', PORT));