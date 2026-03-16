import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
    authId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Auth",
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    gender:{
        type:["male","female","other"],
        required:true,  
    },
    age:{
        type:Number,
        required:true,
    },
    height:{
        type:Number,
        required:true,
    },
    foodPreference:{
        type:["veg","nonveg","eggetarian"],
        required:true,
    },
    medicalConditions:{
        type:["diabetes","hypertension","heart_disease","obesity","thyroid_disorder","pcos","gastritis","anemia","kidney_disease"],
        required:true,
    },
    allergies:{
        type:["milk","peanuts","tree_nuts","eggs","soy","gluten","seafood"],
        required:true,
    },
},{timestamps:true})
const User=mongoose.model("User",userSchema);
export default mongoose.model("User", userSchema);