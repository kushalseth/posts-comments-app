const express = require("express");
const { randomBytes } = require("crypto");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.post("/posts/:id/comments", async (req, res) => {
    const { content } = req.body;
    const commentsId = randomBytes(4).toString("hex");

    const commentToAdd = {
        id: commentsId,
        content:  content,
        status: 'pending'
    };

    const comments = commentsByPostId[req.params.id] || [];
    comments.push(commentToAdd);

    commentsByPostId[req.params.id] = comments;

    await axios.post('http://localhost:4005/events', {
        type: "CommentCreated",
        data: {
            id: commentsId,
            content:  content,
            postId: req.params.id,
            status: 'pending'
        }
    }) 

    res.status(201).send(commentToAdd);
});

app.get("/posts/:id/comments", (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

app.post('/events',async (req, res) => {

    const {type, data} = req.body;
    
    if(type == "CommentModerated") {
        const {postId, id, content, status} = data;
        const comments = commentsByPostId[postId];

        const comment = comments.find( comment => {
            return comment.id == id
        });

        comment.status = status;

         await axios.post('http://localhost:4005/events', {
            type: "CommentUpdated",
            data: {
                id, postId, content, status
            }
        }) 

    }

    res.send({});
});

app.listen(4001, () => {
    console.log("started at 4001");
});