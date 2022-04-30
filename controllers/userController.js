const express = require('express');
const router = express.Router();
router.use(express.json())

const AWS = require('aws-sdk');
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "users"

router.get('/', async (req, res) => {
    const params = {
        TableName: TABLE_NAME
    }

    try {
        const query = await dynamoClient.scan(params).promise()

        res.status(200).send({
            "message": "get all users",
            "data": query.Items
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.post('/', async (req, res) => {
    let randomNumber = Math.random().toString()
    let id = randomNumber.slice(2, randomNumber.length)

    const mail = req.body["email"]
    const password = req.body["password"]
    const province_id = req.body["province_id"]
    const district_id = req.body["district_id"]
    const sub_district_id = req.body["sub_district_id"]

    const fname = req.body["first_name"] || ""
    const lname = req.body["last_name"] || ""
    const nickname = req.body["nickname"] || ""
    const phone = req.body["tel"] || ""
    const address = req.body["address"] || ""

    if (mail === undefined || password === undefined || province_id === undefined || district_id === undefined || sub_district_id === undefined) {
        res.status(400).send({
            "message": "does not recieve the require parameters!"
        })

        return 0
    }

    const params = {
        TableName: TABLE_NAME,
        Item: {
            "user_id": id,
            "first_name": fname,
            "last_name": lname,
            "nickname": nickname,
            "tel": phone,
            "email": mail,
            "password": password,
            "address": address,
            "province_id": province_id,
            "district_id": district_id,
            "sub_district_id": sub_district_id
        }
    }

    try {
        await dynamoClient.put(params).promise()

        res.status(201).send({
            "message": "user create",
            "data": params.Item
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.put('/:id', async (req, res) => {
    const id = req.params["id"]
    const query = {
        TableName: TABLE_NAME,
        Key: {
            "user_id": id
        }
    }

    const checker = await dynamoClient.get(query).promise()
    if (checker.Item === undefined) {
        res.status(404).send({
            "message": `cannot find user id: ${id}`,
        })

        return 0
    }

    const oldData = checker.Item
    const password = req.body["password"] || oldData.password
    const province_id = req.body["province_id"] || oldData.province_id
    const district_id = req.body["district_id"] || oldData.district_id
    const sub_district_id = req.body["sub_district_id"] || oldData.sub_district_id
    const fname = req.body["first_name"] || oldData.first_name
    const lname = req.body["last_name"] || oldData.last_name
    const nickname = req.body["nickname"] || oldData.nickname
    const phone = req.body["tel"] || oldData.tel
    const address = req.body["address"] || oldData.address

    const params = {
        TableName: TABLE_NAME,
        Item: {
            "user_id": id,
            "password": password,
            "first_name": fname,
            "last_name": lname,
            "nickname": nickname,
            "tel": phone,
            "address": address,
            "province_id": province_id,
            "district_id": district_id,
            "sub_district_id": sub_district_id
        }
    }

    try {
        await dynamoClient.put(params).promise()

        res.status(200).send({
            "message": "user data update",
            "data": params.Item
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.delete('/:id', async (req, res) => {
    const id = req.params["id"]

    const query = {
        TableName: TABLE_NAME,
        Key: {
            "user_id": id
        }
    }

    const checker = await dynamoClient.get(query).promise()
    if (checker.Item === undefined) {
        res.status(404).send({
            "message": `cannot find user id: ${id}`,
        })

        return 0
    }



    try {
        await dynamoClient.delete(query).promise()

        res.status(200).send({
            "message": `removed user id: ${id}`,
        })

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": `Internal Server Error`,
        })
    }
})

router.post('/login', async (req, res) => {
    const email = req.body['email']
    const password = req.body['password']

    if (email === undefined || password === undefined) {
        res.status(400).send({
            "message": "missing email or password"
        })

        return 0
    }

    const query = {
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email,
        },
        TableName: TABLE_NAME
    }

    try {
        const checker = await dynamoClient.scan(query).promise()

        if (checker.Count > 1) {
            res.status(404).send({
                "message": "database going down cause some email are in the same user."
            })

            return 0

        } else if (checker.Items[0].password !== password) {
            res.status(404).send({
                "message": "email or password is incorrect"
            })

            return 0

        } else if (checker.Items[0].password === password) {
            res.status(200).send({
                "message": "login complete!",
                "user data": checker.Items[0]
            })

            return 0

        } else {
            throw "Something went wrong!"
        }

    } catch (err) {
        console.log(err);

        res.status(500).send({
            "message": "Internal Server Error",
        })
    }
})

router.get('/checkemail/:email', async (req, res) => {
    let email = req.params["email"]

    if (email === undefined) {
        res.status(400).send({
            "message": "missing params"
        })

        return 0
    }

    const query = {
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email,
        },
        TableName: TABLE_NAME
    }

    try {
        const checker = await dynamoClient.scan(query).promise()

        if (checker.Count === 0) {
            res.status(200).send({
                "message" :"email is valid",
                "status" : true
            })

            return 0
        } else {
            res.status(400).send({
                "message" : "email is already taken",
                "status" : false 
            })

            return 0
        }

    } catch (err) {
        res.status(500).send({
            "message" : "Internal Server Error"
        })
    }
})

module.exports = router;