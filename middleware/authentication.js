import { User } from '../models/user.model.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config("../.ev")
const auth = async (req,res,next)=>{
    try {
        let token = req.header("auth-token");
  
        if(!token) return res.status(404).send({error:'please provide a vlaid json token !'});
        let userId = jwt.verify(token,process.env.JWT_SECRET);
        req.user = userId;
        next();
    } catch (error) {
        console.log(error)
        res.status(400).send({error:"some internal error accured while authentication"})
    }
}

export {auth}
