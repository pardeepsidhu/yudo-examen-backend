// import express from "express";
import express from "express"
import config from "./DB/config.js"
import dotenv from "dotenv"
import userRouter from "./routes/user.route.js"
import cors from "cors"
import { testRouter } from "./routes/test.route.js"
import { questionRoute } from "./routes/question.route.js"
import { generete } from "./contollers/Ai.controller.js"


const app = express();
dotenv.config()

app.use(express.json())
app.use(cors())


app.get("/",(req,res)=>{
    res.send({response:"hello world!"})
})
app.use("/api/v1/user",userRouter)
app.use("/api/v1/test",testRouter)
app.use("/api/v1/question",questionRoute)
app.post("/api/v1/ai/generete",generete)



app.listen(5000,()=>{
 
    console.log("your app is running on port 5000");
    config()
})