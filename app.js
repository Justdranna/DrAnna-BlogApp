const express = require("express")
const dotenv = require("dotenv")
dotenv.config()
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const logger = require("morgan")
const moment = require("moment")
const session = require("express-session")
const bcrypt = require("bcrypt")
//This will show now
const modelExport = require("./models/blog")
const authMiddlewareObj = require("./middlewares/authmiddleware")
const loginRequired = authMiddlewareObj.loginRequired
const alreadyLoggedIn = authMiddlewareObj.alreadyLoggedIn
const Blog = modelExport.Blog
const Comment = modelExport.Comment
const User = modelExport.User

const app = express()
app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"))
app.use(bodyParser.urlencoded({extended: true}))
app.use(logger("dev"))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.locals.moment = moment
app.use((req, res, next) => {
    res.locals.userId = req.session.userId
    res.locals.path = ""
    next()
})

mongoose.connect(process.env.MONGO_URL)
const connObj = mongoose.connection
connObj.on("error", (error) => {
    console.log(error)
})

app.get("/", (req, res) => {
    res.locals.path = "/"
    Blog.find({})
    .then(blogs => {
        // console.log(blogs)
        res.render("home", {blogs: blogs})
    })
    .catch(error => {
        console.log(error)
    })
})

// app.get("/searchblog", (req, res) => {
//     let searchTerm = req.query.search
//     searchTerm = searchterm.toLowerCase()
//     Blog.find({name: searchterm})
//     .then(blog => {
//         res.render("search", {blog: blog})
//     })
//     .catch(error => console.log(error))
// })

app.get("/profile", loginRequired, (req, res) => {
    res.locals.path = "/profile"
    res.render("profile")
})

app.get("/create-blog", (req, res) => {
    // res.locals.path = ""
    res.render("blogform")
})
app.post("/create-blog", (req, res) => {
    const name = req.body.title
    const description = req.body.description
    let imageurl = req.body.imageurl

    if (imageurl === ""){
        imageurl = "/images/default.jpeg"
     }

    Blog.create({name: name, description: description, imageurl: imageurl})
    .then(blog => {
        // console.log(blog)
        res.redirect("/")
    })
    .catch(error => {
        console.log(error)

    // let newblog = {
    //     id: blog.length + 1,
    
    // }
    // blogs.push(newblog)
    // res.redirect("/")
    })
})

app.get("/blogs/:id", loginRequired, (req, res) => {
    // res.locals.path = ""
    const blogId = req.params.id
    Blog.findById(blogId).populate("comments")
    .then(blog => {
        res.render("blogdetail", {blog: blog})
    })
    .catch(error => console.log(error))
})

app.get("/blogs/:id/delete", (req, res) => {
    const blogId = req.params.id
    Blog.deleteOne({_id: blogId})
    .then(blog => {
        res.redirect("/")
    })
    .catch(error => console.log(error))
})

app.post("/blogs/:id/update", (req, res) => {
    const blogId = req.params.id
    const name = req.body.title
    const description = req.body.description
    const imageurl = req.body.imageurl

    Blog.updateOne({_id: blogId}, {$set: {name: name, description: description, imageurl: imageurl}})
    .then(blog => {
        res.redirect("/blogs/" + blogId)
    })
    .catch(error => console.log(error))
})
app.get("/blogs/:id/create-comment", (req, res) => {
    res.send("comment get route")
})
app.post("/blogs/:id/create-comment", (req, res) => {
    // return res.send("comment post route")
    const blogId = req.params.id 
    const title = req.body.title
    let commenter = req.body.commenter

    if(title === ""){
        res.redirect("/blogs/" + blogId)
    }
    else{
        if (commenter === ""){
            commenter = "anonymous"
        }
        Comment.create({title: title, commenter: commenter})
        .then(comment => {
            Blog.findById(blogId)
            .then(blog => {
                blog.comments.push(comment)
                blog.save()
                res.redirect("/blogs/" + blogId)
            })
            .catch(error => console.log(error))
        })
        .catch(error => console.log(error))
    }
})

app.get("/blogs/:blog_id/comments/:comment_id/delete", (req, res) => {
    const blogId = req.params.blog_id
    const commentId = req.params.comment_id
    Comment.deleteOne({_id: commentId})
    .then(comment => {
        res.redirect("/blogs/" + blogId)
    })
    .catch(error => console.log(error))
})

app.get("/accounts/login", alreadyLoggedIn, (req, res) => {
        res.locals.path = "/accounts/login"
        res.render("login")
})
app.post("/accounts/login", (req, res) => {
    const username = req.body.username 
    const password = req.body.password
    // return res.send("this is the login post route")
    User.find({username: username})
    .then(users => {
        if(users.length === 0){
            res.send("The username does not exist")
        }
        else{
            let user = users[0]
            bcrypt.compare(password, user.password, (err, result) => {
                if(err){
                    res.send("There was an error")
                }
                else{
                    if (result === false){
                        res.send("password do not match")
                    }
                    else{
                        req.session.userId = user._id
                        res.redirect("/profile")
                        // res.send("You are now logged in")
                    }
                }
            })
            // if (user.password === password){
            //     res.send("YOu are now logged in")
            // }
            // else{
            //     res.send("password is not correct")
            // }
        }
    })
    .catch(error => console.log(error))
})

app.get("/accounts/logout", loginRequired, (req, res) => {
    req.session.destroy((error) => {
        if(error){
            console.log(error)
        }
        else{
            res.redirect("/")
        }
    })
})

app.get("/accounts/register", alreadyLoggedIn, (req, res) => {
    res.locals.path = "/accounts/register"
    res.render("register")
})

app.post("/accounts/register", (req, res) => {
    const firstName = req.body.firstname
    const lastName = req.body.lastname
    const userName = req.body.username
    const password = req.body.password
    const confirmPassword = req.body.confirmpassword
    const email = req.body.email
    const age = req.body.age

    // return res.send("This is the post route of the register page")

    if (password !== confirmPassword){
        res.send("Both passwords do not match")
    }
    else{
        bcrypt.hash(password, 10, (error, hash) => {
            if(error){
                console.log(error)
            }
            else{
                const userObj = {
                    firstname: firstName,
                    lastname: lastName,
                    username: userName,
                    password: hash,
                    email: email,
                    age: age
                }
                User.create(userObj)
                .then(user => {
                    res.redirect("/accounts/login")
                })
                .catch(error => console.log(error))
            }
        })

    }
})

app.get("/blogs/:blog_id/comment/:comment_id/addlike", (req, res) => {
    const blogId = req.params.blog_id 
    const commentId = req.params.comment_id 
    Comment.findById(commentId)
    .then((comment) => {
        comment.likes = comment.likes + 1
        comment.save()
        res.redirect("/blogs/" + blogId)
    })
    .catch(error => console.log(error))
})

// app.get("/about", (req, res) => {
//     res.locals.path = "/about"
//     res.render("about")
// })
// app.get("/services", (req, res) => {
//     res.send("This is the Services page")
// })
// app.get("/contact", (req, res) => {
//     res.send("This is the contact page")
// })


app.listen(process.env.PORT, process.env.HOST, () => {
    console.log("server has started on port 3000")
})
