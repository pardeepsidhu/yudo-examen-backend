import { Router } from "express";
import { auth } from "../middleware/authentication.js";
import { createTestSeries, getMyTestSeriesById, updateTestSeries } from "../contollers/test.controller.js";
const testRouter=Router();



testRouter.get("/",(req,res)=>{
    res.send({response :"hello world from test route"});
    
})
testRouter.post("/create",auth,createTestSeries)
testRouter.get("/getMyTest/:id",auth,getMyTestSeriesById)
testRouter.put("/update",auth,updateTestSeries)



export {testRouter}