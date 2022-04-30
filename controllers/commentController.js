const express = require('express');
const router = express.Router();
router.use(express.json())

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const dynamoClient = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = "comment"

router.get("/:restaurantID", async (req, res) => {
    const restaurantID = req.params["restaurantID"]

    if (restaurantID === undefined) {
        res.status(400).send({
            "message": "does not recieve the require parameter!"
        })

        return 0
    }

    const params = {
        TableName: TABLE_NAME,
        ExpressionAttributeValues: {
            ":r": restaurantID,
        },
        FilterExpression: "restaurant_id = :r"
    }

    try {
        // check is restaurant deleted
        const query = {
            TableName: "restaurant",
            Key: {
                "restaurant_id": restaurantID
            }
        }
        let restaurantStatus = "fine";
        const checker = await dynamoClient.get(query).promise()
        if (checker.Item === undefined) {
            restaurantStatus = "deleted"
        }

        const commentRAW = await dynamoClient.scan(params).promise()
        if (restaurantStatus === "deleted" && commentRAW.Items === undefined) {
            res.status(404).send({
                "message": `restaurant id ${restaurantID} has been completely deleted (do not have comment left too)`,
            })
        } else if (restaurantStatus === "deleted" && commentRAW.Items !== undefined) {
            res.status(400).send({
                "message": `restaurant id ${restaurantID} has been deleted but comment is left in db`,
                "commentList": commentRAW.Items,
                "commentCounter" : commentRAW.Items.length
            })
        } else if (restaurantStatus === "fine" && commentRAW.Items === undefined) {
            res.status(200).send({
                "message": `restaurant id ${restaurantID} don't have any comment`,
                "commentCounter" : 0
            })
        } else {
            res.status(200).send({
                "message": `comment's list of restaurant id ${restaurantID}`,
                "commentList": commentRAW.Items
            })
        }
    } catch (error) {
        console.log(error);

        res.status(500).send({
            "message": "Internal Server Error"
        })
    }
})

router.post("/", async (req, res) => {
    let randomNumber = Math.random().toString()
    let id = randomNumber.slice(2, randomNumber.length)
    const user_id = req.body["user_id"]
    const detail = req.body["comment_detail"] || ""
    const score = req.body["comment_review_points"]
    const restaurant_id = req.body["restaurant_id"]

    const params = {
        TableName: TABLE_NAME,
        Item: {
            "comment_id" : id,
            "user_id": user_id,
            "comment_detail" : detail,
            "comment_review_points": score,
            "restaurant_id": restaurant_id
        }
    }

    try {
        await dynamoClient.put(params).promise()

        res.status(201).send({
            "message": "comment created",
            "data": params.Item
        })

    } catch (error) {
        console.log(error);

        res.status(500).send({
            "message" : "Internal Server Error"
        })
    }
})

router.put("/:commentID", async (req, res) => {
    const id = req.params["commentID"]

    const query = {
        TableName: TABLE_NAME,
        Key: {
            "comment_id" : id
        }
    }

    try {
        const commentRAW = await dynamoClient.get(query).promise()
        if (commentRAW.Item === undefined) {
            res.status(404).send({
                "message" : `comment id ${id} not found`
            })

            return 0
        }

        const oldData = commentRAW.Item
        const comment_detail = req.body["comment_detail"] || oldData.comment_detail
        const score = req.body["comment_review_points"] || oldData.comment_review_points

        const params = {
            TableName: TABLE_NAME,
            Item: {
                "comment_id": id,
                "comment_detail": comment_detail,
                "comment_review_points": score,
                "restaurant_id": oldData.restaurant_id,
                "user_id": oldData.user_id
            }
        }

        await dynamoClient.put(params).promise()

        res.status(200).send({
            "message" : `comment id ${id} has updated`,
        })

    } catch (error) {
        console.log(error);

        res.status(500).send({
            "message" : "Internal Server Error"
        })
    }
})

router.delete("/:commentID", async (req, res) => {
    const id = req.params["commentID"]

    const params = {
        TableName: TABLE_NAME,
        Key: {
            "comment_id" : id
        }
    }

    try {
        await ddb.deleteItem(params).promise()

        res.status(200).send({
            "message" : `restaurant id ${id}`,
        })

    } catch (error) {
        console.log(error);

        res.status(500).send({
            "message" : "Internal Server Error"
        })
    }
})

module.exports = router;