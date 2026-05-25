const User=require('../../models/userModel')
const bcrypt=require('bcryptjs')

const userSignUp=async(req,res)=>{
    try{
        const {name, email, employeeId, password, managerEmployeeId, role, department}=req.body
        
        // validation
        if(!name || !email || !employeeId || !password || !role || !department ){
            return res.status(400).json(
                {
                    success:false,
                    message:"Please fill all the required fields"
                }
            )
        }

        const showPassword = password; // Store the plain password temporarily for response (to be removed in production)

        if (role === 'Employee' && !managerEmployeeId) {
            return res.status(400).json({
                success:false,
                message:'Please select a manager for this role'
            })
        }

        // check if user already exists
        const existingUser=await User.findOne(
            {
                $or:[
                    {email:email},
                    {employeeId:employeeId}
                ]
            }
        )

        if(existingUser){
            return res.status(400).json(
                {
                    success:false,
                    message:"User with this email or employee ID already exists"
                }
            )
        }

        let managerRecord = null;
        if (managerEmployeeId) {
            managerRecord = await User.findOne({ employeeId: managerEmployeeId });
            if (!managerRecord) {
                return res.status(400).json({
                    success:false,
                    message:'Selected manager is not registered yet'
                });
            }
        }

        if (role === 'Employee') {
            if (!managerRecord || managerRecord.role !== 'Manager(COE)') {
                return res.status(400).json({
                    success:false,
                    message:'Selected manager must be a registered Manager(COE)'
                });
            }
        }

        if (role === 'Employee' && managerRecord && managerRecord.department && managerRecord.department !== department) {
            return res.status(400).json({
                success:false,
                message:'You have entered a different department than your manager. Kindly recheck.'
            });
        }

        // hash password
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)

      

        //create new user
        const newUser=new User(
            {
                name,
                email,
                employeeId,
                password:hashedPassword,
                role,
                department,
                managerEmployeeId: managerEmployeeId || null,
                showPassowrd: showPassword // Temporary field to show password in response, will be removed in production

                
            }
        )

        // save user to database

        const saveduser=await newUser.save()

        return res.status(201).json(
            {
                success:true,   
                message:"User registered successfully",
                user:{
                    id:saveduser._id,
                    name:saveduser.name,
                    email:saveduser.email,
                    employeeId:saveduser.employeeId,
                    role:saveduser.role,
                    managerEmployeeId:saveduser.managerEmployeeId,
                    department:saveduser.department
                }
            }
        )


    }catch(error){
        console.error("Error in userSignUp:", error)
        const isValidationError = error.name === 'ValidationError'
        return res.status(isValidationError ? 400 : 500).json(
            {
                success:false,
                message: isValidationError
                    ? Object.values(error.errors).map(e => e.message).join(', ')
                    : "Internal Server Error"
            }
        )
    }
}

module.exports=userSignUp