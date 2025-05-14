
import { Router } from "express";
import { auth } from "../middleware/authentication.js";
import { answerQuestion, createQuestion, deleteQuestion, getCurrentTestAttempt, updateQuestion } from "../contollers/question.controller.js";
const questionRoute=Router();



questionRoute.get("/",(req,res)=>{
    res.send({response :"hello world from question route"});
    
})
questionRoute.post("/create",auth,createQuestion)
questionRoute.put("/update/:id",auth,updateQuestion)
questionRoute.delete("/delete/:id",auth,deleteQuestion)
questionRoute.post("/answerQuestion",auth,answerQuestion);
questionRoute.get("/getCurrentTestAttempt/:testId",auth,getCurrentTestAttempt)


export {questionRoute}