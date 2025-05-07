
import { Router } from "express";
import { auth } from "../middleware/authentication.js";
import { createQuestion, deleteQuestion, updateQuestion } from "../contollers/question.controller.js";
const questionRoute=Router();



questionRoute.get("/",(req,res)=>{
    res.send({response :"hello world from question route"});
    
})
questionRoute.post("/create",auth,createQuestion)
questionRoute.put("/update",auth,updateQuestion)
questionRoute.delete("/delete/:id",auth,deleteQuestion)



export {questionRoute}