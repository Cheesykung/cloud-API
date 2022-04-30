const express = require('express');
const router = express.Router();
router.use(express.json())

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const provincesRaw = require("../thai_provinces.json")
const districtRaw = require("../thai_district.json")
const sub_districtRaw = require("../thai_sub_district.json")

// router.post("/", async (req, res) => {

//     let raw = sub_districtRaw
//     let n = Object.keys(raw);
//     let putRequestItem = n.map((key) => {

//         let data = {
//             "PutRequest": {
//                 "Item": {
//                     "id": { "S": key },
//                     "name": { "S": raw[key].name.th + "" },
//                     "nameEng": { "S": raw[key].name.en + "" },
//                     "zip_code": { "S": raw[key].zipcode + "" }, // sub_district only
//                     "district_id": { "S": raw[key].amphoe_id + "" }, // sub_district only
//                     "province_id": { "S": raw[key].changwat_id + "" } // district only
//                 }
//             }
//         }

//         return data
//     })

//     putRequestItem.sort((a, b) => {
//         if (a.PutRequest.Item.id < b.PutRequest.Item.id) {
//             return -1;
//         }
//         if (a.PutRequest.Item.id > b.PutRequest.Item.id) {
//             return 1;
//         }
//         return 0;
//     })

//     console.log(putRequestItem.length);

//     while (putRequestItem.length > 0) {
//         let payload = putRequestItem.splice(0, 25)

//         const params = {
//             "RequestItems": {
//                 "sub_district": payload
//             }
//         };

//         // await ddb.batchWriteItem(params).promise()
//     }
//     console.log(putRequestItem.length);
//     res.send("check the db")
// })

router.get("/", async (req, res) => {
    const params = {
        TableName: "provinces"
    }

    try {
        const query = await dynamoClient.scan(params).promise()

        query.Items.sort((a, b) => {
            if (a.id < b.id) {
                return -1;
            }
            if (a.id > b.id) {
                return 1;
            }
            return 0;
        })

        res.status(200).send({
            "message": "get all provinces",
            "data": query.Items
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.get("/:provincesID", async (req, res) => {
    const provinces = req.params["provincesID"]

    const params = {
        TableName: "district",
        FilterExpression: 'province_id = :id',
        ExpressionAttributeValues: {
            ':id': provinces,
        },
    }

    try {
        const query = await dynamoClient.scan(params).promise()

        query.Items.sort((a, b) => {
            if (a.id < b.id) {
                return -1;
            }
            if (a.id > b.id) {
                return 1;
            }
            return 0;
        })

        res.status(200).send({
            "message": "get all district in provinces",
            "data": query.Items
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.get("/:provincesID/:districtID", async (req, res) => {
    const provinces = req.params["provincesID"]
    const district = req.params["districtID"]

    const params = {
        TableName: "sub_district",
        FilterExpression: 'province_id = :provinces AND district_id = :district',
        ExpressionAttributeValues: {
            ':provinces': provinces,
            ':district' : district
        },
    }

    try {
        const query = await dynamoClient.scan(params).promise()

        query.Items.sort((a, b) => {
            if (a.id < b.id) {
                return -1;
            }
            if (a.id > b.id) {
                return 1;
            }
            return 0;
        })

        res.status(200).send({
            "message": "get all sub_district in district",
            "data": query.Items
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

module.exports = router;