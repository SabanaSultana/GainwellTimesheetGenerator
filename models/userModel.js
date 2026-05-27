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
            enum:['Employee','Manager(COE)','Admin'],
            required:true
        },
        managerEmployeeId:{
            type:String,
            default:null
        },
        department:{
            type:String,
            enum:[
                'Mechanical And System Integration',
                'Virtual Engineering Manufacturing',
                'Lean Manufacturing & Tool Design',
                'Electrical And Automation',
                'Hydraulics System Design',
                'Digital Tech. & Program Management',
            ],
            required:true
        }
    },
     {
        timestamps:true
    }
)

module.exports=mongoose.model('User',userSchema)

// remove head of engineering from everywhere, in signup page for manager(COE) don't show any manager option 