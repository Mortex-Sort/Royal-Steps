// server.js
import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());

const token = "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";        // Change this
const owner = "Mortal-Sort";     // Change this
const repo = "Royal-Steps";      // Change this
const branch = "main";

// Allow CORS
app.use((req,res,next)=>{
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","*");
  next();
});

// Endpoint to add product
app.post("/add-product", upload.single("image"), async (req,res)=>{
  try{
    const { name, actualPrice, discountPrice, category, rating } = req.body;
    const file = req.file;

    if(!name || !actualPrice || !file){
      return res.status(400).json({message:"Missing fields"});
    }

    const base64 = file.buffer.toString("base64");
    const imageName = Date.now()+"_"+file.originalname;

    // Upload image to GitHub
    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/images/${imageName}`,{
      method:"PUT",
      headers:{
        "Authorization":"Bearer "+token,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        message:"Upload product image",
        content: base64,
        branch: branch
      })
    });

    // Get current makhna.json
    let resJSON = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/makhna.json`,{
      headers: { "Authorization":"Bearer "+token }
    });
    let data = await resJSON.json();
    let products = [];
    let sha = null;
    if(data.content){
      products = JSON.parse(Buffer.from(data.content, 'base64').toString());
      sha = data.sha;
    }

    // Add new product
    products.push({
      name, actualPrice, discountPrice, category, rating,
      image:`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/images/${imageName}`,
      time: Date.now()
    });

    // Update makhna.json
    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/makhna.json`,{
      method:"PUT",
      headers: { "Authorization":"Bearer "+token, "Content-Type":"application/json" },
      body: JSON.stringify({
        message:"Update products",
        content: Buffer.from(JSON.stringify(products,null,2)).toString("base64"),
        sha,
        branch
      })
    });

    res.json({message:"Product added successfully"});
  }
  catch(err){console.log(err); res.status(500).json({message:"Server error"})}
});

app.listen(5000,()=>console.log("Server running on port 5000"));