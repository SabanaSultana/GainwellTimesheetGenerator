const User=require('../../models/userModel')
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
require('dotenv').config()

const userLogin=async(req,res)=>{
    try{

        const {employeeId,password}=req.body

        // validation
        

        if(!employeeId || !password){
            return res.status(400).json(
                {
                    success:false,
                    message:"All fields are required"
                }
            )
        }

        // check if user existsc:\Users\ME3\Downloads\2026\TimeSheet_Generator\Web_App\backend\controllers\user\userSignUp.js

        const user=await User.findOne({employeeId:employeeId})

       
        if (!user) {
         
            return res.status(404).json({
                success: false,
                message: 'User not registered. Please sign up.',
            });
     }

        // Check password
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
        
        return res.status(401).json({
            success: false,
            message: 'Invalid password',
        });
        }


        // generate JWT token
const token = await jwt.sign(
  { id: user._id, employeeId: user.employeeId, role: user.role },
  process.env.JWT_SECRET_KEY,
  { expiresIn: '1d' }   // ✅ 1 day
);

const tokenOption = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: 24 * 60 * 60 * 1000 // ✅ 1 day (in milliseconds)
};

        

        // add token to cookie 
        res.cookie("token", token, tokenOption)

      

        return res.status(200).json({
            success:true,
            message:"Login successful",
            token:token,
            user:{
                id:user._id,
                employeeId:user.employeeId,
                role:user.role,
                name:user.name
         }})

    }catch(err){
        console.error("Error in user login:", err)
        return res.status(500).json(
            {
                success:false,
                message:"Server Error"
            }
        )

    }
}


module.exports=userLogin;