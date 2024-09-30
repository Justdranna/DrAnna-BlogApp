const mongoose = require("mongoose")

const blogSchema =new mongoose.Schema({
    name: {
        type: String
    },
    description: {
        type: String,
    },
    imageurl: {
        type: String,
        default: "images/default.jpeg"
    },
    dateCreated: {
        type: Date,
        default: Date.now 
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment"
    }]
})

const commentSchema = new mongoose.Schema({
    title: {
        type: String
    },
    dateCommented: {
        type: Date,
        default: Date.now
    },
    commenter: {
        type: String
    },
    likes: {
        type: Number,
        default: 0
    }
})

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
    },
    lastname: {
        type: String
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
    },
    password: {
        type: String
    },
    age: {
        type: Number
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts"
    }]
})

const User = mongoose.model("user", userSchema)
const Comment = mongoose.model("comment", commentSchema)
const Blog = mongoose.model("blog", blogSchema)

const modelExport = {
    Comment: Comment,
    Blog: Blog,
    User: User
}

module.exports = modelExport