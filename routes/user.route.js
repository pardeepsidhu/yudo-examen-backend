import { Router } from "express";
import { googleLogin, login, resetPassLink, signup, verifyOtp } from "../contollers/user.controler.js";
const router=Router();



router.get("/",(req,res)=>{
    res.send({response :"hello world from user route"});
    
})
router.post("/signup",signup)
router.post("/verify",verifyOtp)
router.post("/login",login)
router.post("/google",googleLogin)
router.post("/resetPassLink",resetPassLink)


export default router;