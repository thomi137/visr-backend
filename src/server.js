const express = require('express');

const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const firebaseAdmin = require('firebase-admin');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

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

// Firebase Admin
const serviceAccount = require('./firebase/firebase-service-account.json');
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    storageBucket: 'visr-8d89f.appspot.com'
});


// Routes
// https://stackoverflow.com/questions/51899990/pass-object-to-routes-file-used-as-middleware-in-nodejs
const imageRoutes = require('./images/images');
const annotatorRoutes = require('./images/annotate');
app.use('/images', imageRoutes(firebaseAdmin));
app.use('/annotate', annotatorRoutes(firebaseAdmin))

app.get('/ping', async (req, res) => {
    res.status(418).json({ message: 'pong' });
});


const PORT = process.env.PORT || 3003
  
app.listen(PORT, () => console.log('Server running on ', PORT));
