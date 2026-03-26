import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      default: "Dietician",
    },
    experience: {
      type: Number,
      default: 0,
    },
    hospital: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);
