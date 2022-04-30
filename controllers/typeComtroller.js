const express = require('express');
const router = express.Router();
router.use(express.json())

const AWS = require('aws-sdk');
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "restaurant_type"

router.get("/", async (req, res) => {
    const params = {
        TableName: TABLE_NAME
    }

    try {
        const query = await dynamoClient.scan(params).promise()

        res.status(200).send({
            "message": "get all restaurant type",
            "data": query.Items
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.post("/", async (req, res) => {
    const name = req.body["type_name"]

    if (name === undefined) {
        res.status(400).send({
            "message": "does not recieve the require parameters!"
        })

        return 0
    }

    const query = {
        TableName: TABLE_NAME,
        ProjectionExpression: "type_id"
    }

    let id
    const checker = await dynamoClient.scan(query).promise()
    if (checker.Count === 0) {
        id = 1
    } else {
        const sorted = checker.Items
        sorted.sort((a, b) => {
            if (a.type_id < b.type_id) {
                return 1;
            }
            if (a.type_id > b.type_id) {
                return -1;
            }
            return 0;
        })

        id = parseInt(sorted[0].type_id) + 1
    }

    const params = {
        TableName: TABLE_NAME,
        Item: {
            "type_id": id + "",
            "type_name": name
        }
    }

    try {
        await dynamoClient.put(params).promise()

        res.status(201).send({
            "message": "create type",
            "data": params.Item
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.get("/:id", async (req, res) => {
    const id = req.params["id"]

    console.log(id);

    const params = {
        TableName: TABLE_NAME,
        Key: {
            "type_id": id
        }
    }

    try {
        const query = await dynamoClient.get(params).promise()

        if (query.Item === undefined) {
            res.status(404).send({
                "message": `not found restaurant type id ${id}`,
            })

            return 0
        }

        res.status(200).send({
            "message": `get type id ${id}`,
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