const express = require('express');
const router = express.Router();
router.use(express.json())

const AWS = require('aws-sdk');
const dynamoClient = new AWS.DynamoDB.DocumentClient();

router.get("/provinces/:provincesID", async (req, res) => {
    const id = req.params["provincesID"]

    const params = {
        TableName: "provinces",
        Key: {
            "id": id
        }
    }

    try {
        const query = await dynamoClient.get(params).promise()

        if (query.Item === undefined) {
            res.status(404).send({
                "message": `not found provinces id ${id}`,
            })

            return 0
        }

        res.status(200).send({
            "message": `get provinces id ${id}`,
            "data": query.Item
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.get("/district/:districtID", async (req, res) => {
    const id = req.params["districtID"]

    const params = {
        TableName: "district",
        Key: {
            "id": id
        }
    }

    try {
        const query = await dynamoClient.get(params).promise()

        if (query.Item === undefined) {
            res.status(404).send({
                "message": `not found provinces id ${id}`,
            })

            return 0
        }

        res.status(200).send({
            "message": `get districtID id ${id}`,
            "data": query.Item
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.get("/subDistrict/:subDistrictID", async (req, res) => {
    const id = req.params["subDistrictID"]

    const params = {
        TableName: "sub_district",
        Key: {
            "id": id
        }
    }

    try {
        const query = await dynamoClient.get(params).promise()

        if (query.Item === undefined) {
            res.status(404).send({
                "message": `not found provinces id ${id}`,
            })

            return 0
        }

        res.status(200).send({
            "message": `get sub_district id ${id}`,
            "data": query.Item
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

module.exports = router;