import mongoose from "mongoose";

const connect =async()=>{
try {
    mongoose.connect(process.env.DATA_BASE)
   
    console.log(`---database connected successfuly---`)
} catch (error) {
    // console.log(process.env.test + " fromm dv")
    console.log({error})
}
}

export default connect