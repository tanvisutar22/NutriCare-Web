import { ApiError } from "../utils/ApiError.js";

const authorizeRole=(role)=>{

    return (req,res,next)=>{
        console.log("User in authorizeRole:", req.user); // Debugging line
        if(req.user?.userType!=role)
            return res.status(403).json(new ApiError(403,"You are not authorized to do this"))
        return next();
    }
}
export {authorizeRole};