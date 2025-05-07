

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const generete = async(req,res)=>{

    try {
        const {prompt} = req.body;
        if(!prompt) res.send({error:"Please Provide Required Prompt !"})
      
        const result = await model.generateContent(prompt);
        let response = JSON.stringify(result.response.text())
        // response = Object(response)

        res.send({response})
    } catch (error) {
        console.log(error)
        res.status(400).send({error:"Some Error Accured While Generating Email !"})
    }
}

export {generete}