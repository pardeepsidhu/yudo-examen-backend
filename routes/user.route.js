import { Router } from "express";
import { getMyProfile, getUserProfileAndTests, googleLogin, login, resetPassLink, signup, updateProfile, verifyOtp } from "../contollers/user.controler.js";
import { auth } from "../middleware/authentication.js";
const router=Router();



router.get("/",(req,res)=>{
    res.send({response :"hello world from user route"});
    
})
router.post("/signup",signup)
router.post("/verify",verifyOtp)
router.post("/login",login)
router.post("/google",googleLogin)
router.post("/resetPassLink",resetPassLink)
router.get("/getMyProfile", auth,getMyProfile)
router.put("/updateProfile", auth,updateProfile)
router.get("/getUserProfileAndTests/:id",getUserProfileAndTests);

export default router;