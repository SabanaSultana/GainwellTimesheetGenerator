const mongoose=require('mongoose')

const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        employeeId:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true
        } ,
        showPassowrd:{    // Temporary field to show password in response, will be removed in production
            type:String
        },
        role:{
            type:String,
            enum:['Employee','Manager(COE)','Head of Engineering','Admin'],
            required:true
        },
        managerEmployeeId:{
            type:String,
            default:null
        },
        department:{
            type:String,
            enum:[
                'Mechanical and System Integration',
                'Virtual Manufacturing',
                'Smart Manufacturing',
                'Electrical and Automation',
                'Hydraulic',
                'Engineering & System',
                'Head of Engineering'
            ],
            required:true
        }
    },
     {
        timestamps:true
    }
)

module.exports=mongoose.model('User',userSchema)