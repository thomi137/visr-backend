const express = require('express');
const router = express.Router();
const vision = require('@google-cloud/vision');
const { response } = require('express');

module.exports = (firebaseAdmin) => {

    const datastore = firebaseAdmin.firestore();
    const imageAnnotator = new vision.ImageAnnotatorClient({
        keyFilename: './src/firebase/firebase-service-account.json'
    })

    router.get('/label', async (req, res, next) => {

        try {
            labels = await imageAnnotator.labelDetection({
                image: {source: {imageUri: 'https://storage.googleapis.com/visr-8d89f.appspot.com/IMG_7719.png'}}          
            })
            if(labels[0].error) {
                res.status(400).json({message: labels.error.message})
            }
            res.json(labels[0].labelAnnotations);

        } catch (error) {
            console.error(err);
            res.status(500).send({message: err.message});
        }
    });


    router.post('/web_entity', async (req, res, next) => {
        try {
            const imageUrl = req.body.url;
            console.log(imageUrl);
            const [labels] = await imageAnnotator.webDetection({
                image: {source: {imageUri: imageUrl}}          
            })
            if(labels.error) {
                res.status(400).json({message: labels.error.message})
            }
            res.json(labels.webDetection);

        } catch (error) {
            console.error(error);
            res.status(500).send({message: error.message});
        }
    });

    router.get('/landmark', async (req, res, next) => {

        try {
            [labels] = await imageAnnotator.landmarkDetection({
                image: {source: {imageUri: 'https://storage.googleapis.com/visr-8d89f.appspot.com/IMG_7719.png'}}          
            })
            if(labels.error) {
                res.status(400).json({message: labels.error.message})
            }
            res.json(labels);

        } catch (error) {
            console.error(err);
            res.status(500).send({message: err.message});
        }
    });
    

    return router;
}