import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Profile from '../models/profile.model.js';
import PDFDocument from "pdfkit";
import fs from "fs";


// const covertuserDataTOPDF = async (userData) => {
//     const doc = new PDFDocument();
//     const outputpath = crypto.randomBytes(16).toString("hex") + ".pdf";
//     const stream = fs.createWriteStream("uploads/" + outputpath);
//     doc.pipe(stream);
//     doc.image(`uploads/${userData.profilePicture}`, { width: 100, align: "center" });
//     doc.fontSize(14).text(`Name: ${userData.userId.name}`);
//     doc.fontSize(14).text(`Email: ${userData.userId.email}`);
//     doc.fontSize(14).text(`Username: ${userData.userId.username}`);
//     doc.fontSize(14).text(`Bio: ${userData.bio}`);
//     doc.fontSize(14).text(`Current Work: ${userData.currentwork}`);
//     doc.fontSize(14).text(`Post Work: ${userData.postwork}`);
//     userData.skills.forEach((skill, index) => {
//         doc.fontSize(14).text(`Skill ${index + 1}: ${skill}`);
//     });
//     userData.education.forEach((edu, index) => {
//         doc.fontSize(14).text(`Education ${index + 1}: ${edu}`);
//     });

//     doc.fontSize(14).text('Past Work:');
//     userData.pastwork.forEach((work, index) => {
//         doc.fontSize(14).text(`Company Name: ${work.companyName}`);
//         doc.fontSize(14).text(`Role: ${work.role}`);
//         doc.fontSize(14).text(`Duration: ${work.duration}`);
//     });

//     doc.end();

//     return outputpath;
// };

const covertuserDataTOPDF = async (userData) => {
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync("uploads")) {
                fs.mkdirSync("uploads", { recursive: true });
            }

            const doc = new PDFDocument();
            const outputFileName = crypto.randomBytes(16).toString("hex") + ".pdf";
            const filePath = `uploads/${outputFileName}`;
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // SAFE IMAGE CHECK: Check if the user has a profile picture AND if the file exists on disk
            const imgPath = userData.userId?.profilePicture;
            if (imgPath && fs.existsSync(imgPath)) {
                doc.image(imgPath, { width: 80, align: "center" });
                doc.moveDown();
            }

            // User Basic Info
            doc.fontSize(16).text(`Name: ${userData.userId?.name || "N/A"}`);
            doc.fontSize(12).text(`Email: ${userData.userId?.email || "N/A"}`);
            doc.fontSize(12).text(`Username: ${userData.userId?.username || "N/A"}`);
            doc.fontSize(12).text(`Bio: ${userData.bio || "N/A"}`);
            doc.moveDown();

            // Current Work
            if (userData.currentwork) {
                doc.fontSize(14).text("Current Work:", { underline: true });
                doc.fontSize(12).text(`Company: ${userData.currentwork.company || "N/A"}`);
                doc.fontSize(12).text(`Position: ${userData.currentwork.position || "N/A"}`);
                doc.fontSize(12).text(`Years: ${userData.currentwork.years || 0}`);
                doc.moveDown();
            }

            // Past Work
            if (userData.postwork && userData.postwork.length > 0) {
                doc.fontSize(14).text("Past Work:", { underline: true });
                userData.postwork.forEach((work, index) => {
                    doc.fontSize(12).text(`${index + 1}. ${work.company || "N/A"} - ${work.position || "N/A"} (${work.years || 0} years)`);
                });
                doc.moveDown();
            }

            // Education
            if (userData.education && userData.education.length > 0) {
                doc.fontSize(14).text("Education:", { underline: true });
                userData.education.forEach((edu, index) => {
                    doc.fontSize(12).text(`${index + 1}. ${edu.degree || "Degree"} at ${edu.college || edu.school || "Institution"}`);
                });
            }

            doc.end();

            stream.on("finish", () => resolve(outputFileName));
            stream.on("error", (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
};

const activecheck = async (req, res) => {
    return res.status(200).json({ message: "Active check successful" });
};

const register = async (req, res) => {
    try{
        const { name, email, password, username } = req.body;
        if(!name || !email || !password || !username) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await User.findOne({
            email
        })
        if(user) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedpassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedpassword,
            username
        });

        await newUser.save();

        const profile = new Profile({
            userId: newUser._id,
            bio: "",
            currentwork: {},
            postwork: [],
            education: []
        });

        await profile.save();
        return res.status(201).json({ message: "User registered successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = crypto.randomBytes(32).toString("hex");
        await User.findByIdAndUpdate(user._id, { token });
        return res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        return res.status(500).json({ message: "Login failed", error: error.message });
    }
};

const uploadprofilepicture = async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        user.profilePicture = req.file.path;

        await user.save();

        return res.status(200).json({ message: "Profile picture uploaded successfully", profilePicture: user.profilePicture });
    } catch (error) {
        return res.status(500).json({ message: "Profile picture upload failed", error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    const { token, ...newuserdata} = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const [username, email] = newuserdata;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if(existingUser|| existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: "Email is already in use" });
            }
        }

        await user.save();

        return res.status(200).json({ message: "User profile updated successfully", user });
    } catch (error) {
        return res.status(500).json({ message: "User profile update failed", error: error.message });
    }
};

const   getUserAndProfile = async (req, res) => {
    
    try {
        const { token } = req.query;
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        let profile = await Profile.findOne({ userId: user._id }).populate('userId', 'name email username profilePicture');
        if (!profile) {
            profile = new Profile({
                userId: user._id,
                bio: "",
                currentwork: {},
                postwork: [],
                education: []
            });
            await profile.save();
            
            profile = await Profile.findById(profile._id).populate('userId', 'name email username profilePicture');
        }
        return res.status(200).json({ message: "User retrieved successfully", user, profile });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve user", error: error.message });
    }
};

const updateProfileData = async (req, res) => {
    try {
        const { token, ...profileData } = req.body;
        
        const userProfile = await User.findOne({ token: token });
        if (!userProfile) {
            return res.status(401).json({ message: "user not found" });
        }
        const profile_to_update = await Profile.findOne({ userId: userProfile._id });
        if (!profile_to_update) {
            return res.status(404).json({ message: "Profile not found" });
        }
        Object.assign(profile_to_update, profileData);
        await profile_to_update.save();
        return res.status(200).json({ message: "Profile updated successfully", profile: profile_to_update });
    } catch (error) {
        return res.status(500).json({ message: "Profile update failed", error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        return res.status(200).json({ message: "Users retrieved successfully", users });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve users", error: error.message });
    }
};

const downloadResume = async (req, res) => {
    const user_id = req.query.userId;
    const userProfile = await Profile.findOne({ userId: user_id }).populate('userId', 'name email username profilePicture');
    let outputpath = await covertuserDataTOPDF(userProfile);
    return res.json({ message: "Resume downloaded successfully", resume: outputpath });
};

const sendConnectionRequest = async (req, res) => {
    const {token, connectionid} = req.body;
    try {
        const user = await User.findOne({ token: token });
        const connectionUser = await User.findById(connectionid);
        if (!user || !connectionUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Logic to send connection request
        const connectionUserProfile = await User.findOne({ userId: connectionUser._id });
        const existingRequest = await ConnectionRequest.findOne({ senderId: user._id, receiverId: connectionUser._id });
        if (existingRequest) {
            return res.status(400).json({ message: "Connection request already sent" });
        }
        const newRequest = new ConnectionRequest({
            senderId: user._id,
            receiverId: connectionUser._id
        });
        await newRequest.save();
        return res.status(200).json({ message: "Connection request sent successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to send connection request", error: error.message });
    }
};

const getMyConnectionsRequests = async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const connectionRequests = await ConnectionRequest.find({ receiverId: user._id }).populate('senderId', 'name email username profilePicture');
        return res.status(200).json({ message: "Connection requests retrieved successfully", requests: connectionRequests });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve connection requests", error: error.message });
    }
};

const whatAreMyConnections = async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const connections = await ConnectionRequest.find({ senderId: user._id, status: "accepted" }).populate('receiverId', 'name email username profilePicture');
        return res.status(200).json({ message: "Connections retrieved successfully", connections: connections });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve connections", error: error.message });
    }
};

const acceptConnectionRequest = async (req, res) => {
    const { token, requestId, action_type } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const connection = await ConnectionRequest.findById(requestId);
        if (!connection) {
            return res.status(404).json({ message: "Connection request not found" });
        }
        if(action_type !== "accept" ) {
            connection.status_accepted = true;
        } else {
            connection.status_rejected = false;
        }
        await connection.save();
        return res.status(200).json({ message: `Connection request ${action_type}ed`, connection });
    } catch (error) {
        return res.status(500).json({ message: "Failed to accept connection request", error: error.message });
    }
};

const rejectConnectionRequest = async (req, res) => {
    const { token, requestId } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const connection = await ConnectionRequest.findById(requestId);
        if (!connection) {
            return res.status(404).json({ message: "Connection request not found" });
        }
        connection.status_rejected = true;
        await connection.save();
        return res.status(200).json({ message: "Connection request rejected", connection });
    } catch (error) {
        return res.status(500).json({ message: "Failed to reject connection request", error: error.message });
    }
};

const getUserProfileBasedonUsername = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username: username }).populate('profilePicture', 'url');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userProfile = await Profile.findOne({ userId: user._id }).populate('userId', 'name email username profilePicture');
        return res.status(200).json({ message: "User profile retrieved successfully", user: userProfile });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve user profile", error: error.message });
    }
};

export { activecheck, register, login, uploadprofilepicture, updateProfileData, getUserAndProfile, updateUserProfile, getAllUsers, downloadResume, sendConnectionRequest, acceptConnectionRequest, getMyConnectionsRequests, whatAreMyConnections, rejectConnectionRequest, getUserProfileBasedonUsername };