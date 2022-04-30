const express = require('express')
const app = express()
const cors = require('cors')
const { PORT = 3000 }  = process.env


// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
require('dotenv').config()

AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.aws_session_token
})

//Routes Variables
const userAPI = require("./controllers/userController")
const countryAPI = require("./controllers/countryController")
const restaurantTypeAPI = require("./controllers/typeComtroller")
const restaurantAPI = require("./controllers/restaurantController")
const countryDetailAPI = require("./controllers/countryDetailController")
const commentAPI = require("./controllers/commentController")

app.use("/users", userAPI)
app.use("/country", countryAPI)
app.use("/type", restaurantTypeAPI)
app.use("/restaurant", restaurantAPI)
app.use("/countryDetail", countryDetailAPI)
app.use("/comment", commentAPI)

app.use(express.json())
app.use(cors("*"))
app.listen(PORT)