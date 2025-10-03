export const signUp = async(req , res)=>{
    try{
        const {username , email , password} = req.body;
        const existingUser = User.findOne({email});
        if(existingUser){
            res.status(401).json({
                success:false , 
                message:"User already exists"
            })
        }
    }
    catch(error){
        res.status(501).json({
            success:false , 
            message:"Internal server error"
        })
    }
}
