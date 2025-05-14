import { Router } from "express";
import { auth } from "../middleware/authentication.js";
import { createTestSeries, getAllTestSeries, getMyTestSeriesById, getTestSeriesById, updateTestSeries } from "../contollers/test.controller.js";
import { getCurrentTestAttempt } from "../contollers/question.controller.js";
const testRouter=Router();



testRouter.get("/",(req,res)=>{
    res.send({response :"hello world from test route"});
    
})
testRouter.post("/create",auth,createTestSeries)
testRouter.get("/getMyTest/:id",auth,getMyTestSeriesById)
testRouter.get("/getTest/:id",auth,getCurrentTestAttempt)
testRouter.put("/update",auth,updateTestSeries)
testRouter.get("/getAll",getAllTestSeries)




export {testRouter}