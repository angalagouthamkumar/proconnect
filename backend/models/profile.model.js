import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
    school: {
        type: String,
        default: "",
    },
    college: {
        type: String,
        default: "",
    },
    degree: {
        type: String,
        default: "",
    },
    fieldOfStudy: {
        type: String,
        default: "",
    },
});

const workSchema = new mongoose.Schema({
    company: {
        type: String,
        default: "",
    },
    position: {
        type: String,
        default: "",
    },
    years: {
        type: Number,
        default: 0,
    },
});

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    bio: {
        type: String,
        default: "",
    },
    currentwork: {
        type: workSchema,
        default: () => ({}),
    },
    postwork: {
        type: [workSchema],
        default: [],
    },
    education: {
        type: [educationSchema],
        default: [],
    },
});

const Education = mongoose.model("Education", educationSchema);
const Work = mongoose.model("Work", workSchema);
const Profile = mongoose.model("Profile", profileSchema);

export { Education, Work };
export default Profile;