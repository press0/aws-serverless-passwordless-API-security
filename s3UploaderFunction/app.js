/*
  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({region: process.env.AWS_REGION})
const s3 = new AWS.S3()

exports.handler = async (event) => {
    const assetId = event['pathParameters']['asset-id']
    const result = await getDownloadURL(assetId)
    console.log('get Result: ', result)
    return result
};

exports.handlerPost = async (event) => {
    const assetId = getRandomInt(1, 1000000)
    const result = await getUploadURL(assetId)
    console.log('post Result: ', result)
    return result
};

exports.handlerPut = async (event) => {
    const assetId = event['pathParameters']['asset-id']
    const result = await tagUploadStatus(assetId)
    console.log('put Result: ', result)
    return result
};

const getDownloadURL = async function (assetId) {
    const s3Params = {
        Bucket: process.env.UploadBucket,
        Key: `${assetId}`
    };

    console.log('getUploadURL: ', s3Params)
    return new Promise((resolve, reject) => {
        resolve({
            "statusCode": 200,
            "isBase64Encoded": false,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify({
                "Download_url": s3.getSignedUrl('getObject', s3Params)
            })
        })
    })
};

const getUploadURL = async function (actionId) {
    const s3Params = {
        Bucket: process.env.UploadBucket,
        Key: `${actionId}`
    };

    console.log('getUploadURL: ', s3Params)
    return new Promise((resolve, reject) => {
        resolve({
            "statusCode": 200,
            "isBase64Encoded": false,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify({
                "upload_url": s3.getSignedUrl('putObject', s3Params),
                "id": actionId
            })
        })
    })
};

const tagUploadStatus = async function (assetId) {
    const BUCKET_NAME = process.env.UploadBucket
    const COPY_SOURCE = BUCKET_NAME + '/' + assetId

    const s3Params = {
        Bucket: BUCKET_NAME,
        Key: assetId
    };
    const params1 = {
        Bucket: BUCKET_NAME,
        Key: assetId,
        Tagging: {
            TagSet: [
                {
                    Key: "uploaded",
                    Value: "true"
                }
            ]
        }
    };
    const params2 = {
        Bucket: BUCKET_NAME,
        Key: assetId
    };

    let tags;
    let errors;
    s3.putObjectTagging(params1, function (err, data) {
        if (err) {
            errors = err;
            console.log(err, err.stack); // an error occurred
        }
        else console.log(data);           // successful response
    });
    s3.getObjectTagging(params2, function (err, data) {
        if (err) {
            tags = err;
            console.log(err, err.stack); // an error occurred
        }
        else tags = data;           // successful response
    });


    console.log('getStatus: ', s3Params)
    return new Promise((resolve, reject) => {

        // Get Status
        resolve({
            "statusCode": 200,
            "isBase64Encoded": false,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify({
                CopySource: COPY_SOURCE,
                Tags: "tags: " + tags,
                Errors: "errors: " + errors,
                "Status": "uploaded"
            })
        })
    })
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

