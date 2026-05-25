const jwt=require("jsonwebtoken");
require("dotenv").config();

const authMiddleware=(req,res,next)=>{
    try{
        const token=req.cookies?.token;
      
        if(!token){
            return res.status(401).json(
             {
                success:false,
                message:"Please Login First"
             }
            )
        }

        // Verify the token
        const decoded=jwt.verify(token, process.env.JWT_SECRET_KEY);



        if(!decoded){
            return res.status(401).json({
                success:false,
                message:"Invalid Token"
            })
        }

        req.user=decoded;
        

        next();        

    }catch(error){
        return res.status(401).json({
            success:false,
            message:"Invalid or expired token"
        })
    }
}



const isEmployee = (req, res, next) => {
  if (req.user.role !== "Employee") {
    return res.status(403).json({
      success: false,
      message: "Employee access only",
    });
  }
  next();
};

const isManager = (req, res, next) => {
  if (req.user.role !== "Manager(COE)") {
    return res.status(403).json({
      success: false,
      message: "Manager access only",
    });
  }
  next();
};

const isHeadManager = (req, res, next) => {
  if ( req.user.role !== "Head of Engineering") {
    return res.status(403).json({
      success: false,
      message: "Head Manager access only",
    });
  }
  next();
};

const isAdmin=(req,res,next)=>{
    if(req.user.role !=='Admin'){
        return res.status(403).json(
            {
                success:false,
                message:"Admin access only"
            }
        )
    }
    next();
}

// Allows Manager(COE) and Admin
const isManagerLevel = (req, res, next) => {
  const allowed = ['Manager(COE)', 'Admin'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Manager level or above required.',
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  isEmployee,
  isManager,
  isHeadManager,
  isAdmin,
  isManagerLevel,
};
