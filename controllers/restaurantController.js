const express = require('express');
const router = express.Router();
router.use(express.json())

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const dynamoClient = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = "restaurant"

router.get("/", async (req, res) => {
    let params = {
        TableName: TABLE_NAME,
    }

    const restaurantRaw = await dynamoClient.scan(params).promise()

    res.status(200).send({
        "message": "all restaurant",
        "data": restaurantRaw.Items
    })
})

router.post("/", async (req, res) => {
    let randomNumber = Math.random().toString()
    let id = randomNumber.slice(2, randomNumber.length)

    let name = req.body["restaurant_name"]
    let typeID = req.body["type_id"]
    let description = req.body["restaurant_description"] || ""

    if (name === undefined || typeID === undefined) {
        res.status(400).send({
            "message": "does not recieve the require parameters!"
        })

        return 0
    }

    let user = req.body["user_id"]
    let review = req.body["restaurant_review"]
    let score = req.body["restaurant_review_points"]

    if (score > 5 || score < 0) {
        res.status(400).send({
            "message": "invalid score"
        })

        return 0
    }
    if (user === undefined || review === undefined) {
        res.status(400).send({
            "message": "does not recieve the require parameters!"
        })

        return 0
    }

    let address = req.body["restaurant_address"] || ""
    let province_id = req.body["province_id"]
    let district_id = req.body["district_id"]
    let sub_district_id = req.body["sub_district_id"]

    if (province_id === undefined || district_id === undefined || sub_district_id === undefined) {
        res.status(400).send({
            "message": "invalid score"
        })

        return 0
    }

    const params = {
        TableName: TABLE_NAME,
        Item: {
            "restaurant_id": id,
            "restaurant_name": name,
            "restaurant_type": typeID,
            "restaurant_description": description,
            "restaurant_address": address,
            "restaurant_review": review,
            "restaurant_review_points": score,
            "user_id": user,
            "province_id": province_id,
            "district_id": district_id,
            "sub_district_id": sub_district_id
        }
    }

    try {
        await dynamoClient.put(params).promise()

        res.status(201).send({
            "message": "review created",
            "data": params.Item
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }

})

router.get("/:user_id/:limitor?", async (req, res) => {
    const limitor = req.params["limitor"] || 10
    const user = req.params["user_id"]

    let query = {
        TableName: "users",
        Key: {
            "user_id": user
        }
    }

    const userData = await dynamoClient.get(query).promise()
    if (userData.Item === undefined) {
        res.status(404).send({
            "message": `cannot find user id: ${user}`
        })

        return 0
    }

    const district_id = userData.Item.district_id
    query = {
        TableName: "district",
        Key: {
            "id": district_id
        }
    }
    const districtRaw = await dynamoClient.get(query).promise()
    const districtData = districtRaw.Item

    const province_id = userData.Item.province_id
    query = {
        TableName: "provinces",
        Key: {
            "id": province_id
        }
    }
    const provincesRaw = await dynamoClient.get(query).promise()
    const provincesData = provincesRaw.Item

    const params = {
        TableName: TABLE_NAME,
        Limit: 50,
        ExpressionAttributeValues: {
            ":d": district_id,
        },
        FilterExpression: "district_id = :d",
    }

    const restaurantRaw = await dynamoClient.scan(params).promise()
    if (restaurantRaw.Count > limitor) {
        restaurantRaw.Items.splice(0, restaurantRaw.Count - limitor)
    }

    let result = await Promise.all(restaurantRaw.Items.map(async item => {
        query = {
            TableName: "sub_district",
            Key: {
                "id": item.sub_district_id
            }
        }

        let typeQuery = {
            TableName: "restaurant_type",
            Key: {
                "type_id": item.restaurant_type
            }
        }

        const typeRaw = await dynamoClient.get(typeQuery).promise()
        const sub_districtRaw = await dynamoClient.get(query).promise()

        delete item["restaurant_type"]
        delete item["sub_district_id"]
        delete item["province_id"]
        delete item["district_id"]

        return {
            ...item,
            "type": typeRaw.Item,
            "sub_district": sub_districtRaw.Item,
            "province": provincesData,
            "district": districtData
        }
    }))

    res.status(200).send({
        "message": `${limitor} nearest restaurant`,
        "data": result
    })
})

router.put("/:id", async (req, res) => {
    const id = req.params["id"]
    let query = {
        TableName: TABLE_NAME,
        Key: {
            "restaurant_id": id
        }
    }

    const restaurantRaw = await dynamoClient.get(query).promise()
    if (restaurantRaw.Item === undefined) {
        res.status(404).send({
            "message": `restaurant id ${id} not found`
        })

        return 0
    }
    const oldData = restaurantRaw.Item
    const restaurant_name = req.body["restaurant_name"] || oldData.restaurant_name
    const restaurant_type = req.body["restaurant_type"] || oldData.restaurant_type
    const restaurant_description = req.body["restaurant_description"] || oldData.restaurant_description
    const restaurant_address = req.body["restaurant_address"] || oldData.restaurant_address
    const restaurant_review = req.body["restaurant_review"] || oldData.restaurant_review
    const score = req.body["restaurant_review_points"] || oldData.restaurant_review_points
    const province_id = req.body["province_id"] || oldData.province_id
    const district_id = req.body["district_id"] || oldData.district_id
    const sub_district_id = req.body["sub_district_id"] || oldData.sub_district_id

    const params = {
        TableName: TABLE_NAME,
        Item: {
            ...oldData,
            "restaurant_id": id,
            "restaurant_name": restaurant_name,
            "restaurant_type": restaurant_type,
            "restaurant_description": restaurant_description,
            "restaurant_address": restaurant_address,
            "restaurant_review": restaurant_review,
            "restaurant_review_points": score,
            "province_id": province_id,
            "district_id": district_id,
            "sub_district_id": sub_district_id
        }
    }

    try {
        await dynamoClient.put(params).promise()

        res.status(200).send({
            "message": `restaurant id ${id} has been updated`
        })

    } catch (error) {
        res.status(500).send({
            "message": "Internal Server Error"
        })
    }
})

router.delete("/:id", async (req, res) => {
    const id = req.params["id"]

    const params = {
        TableName: TABLE_NAME,
        Key: {
            "restaurant_id": id
        }
    }

    try {
        await ddb.deleteItem(params).promise()

        res.status(200).send({
            "message": `restaurant id ${id}`,
        })

    } catch (error) {
        console.log(error);

        res.status(500).send({
            "message": "Internal Server Error"
        })
    }
})

module.exports = router;