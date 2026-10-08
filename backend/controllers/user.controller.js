import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Profile from '../models/profile.model.js';
import PDFDocument from "pdfkit";
import fs from "fs";
import Connection from "../models/connections.model.js";


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
        if (error.code === 11000 && (error.keyPattern?.username || error.keyValue?.username || (error.message && error.message.includes("username")))) {
            return res.status(409).json({ message: "Username already taken" });
        }
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
    const { token, name, username } = req.body;
    try {
        // Authorization: the account being edited is always the owner of this token
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (typeof username === "string" && username.trim() && username.trim() !== user.username) {
            const cleanUsername = username.trim();
            if (!/^[A-Za-z0-9_.]{3,30}$/.test(cleanUsername)) {
                return res.status(400).json({ message: "Username must be 3-30 characters: letters, numbers, _ or ." });
            }
            const taken = await User.findOne({
                username: new RegExp("^" + cleanUsername.replace(/\./g, "\\.") + "$", "i"),
                _id: { $ne: user._id },
            });
            if (taken) {
                return res.status(400).json({ message: "Username is already taken" });
            }
            user.username = cleanUsername;
        }

        if (typeof name === "string" && name.trim()) {
            if (name.trim().length > 60) {
                return res.status(400).json({ message: "Name must be 60 characters or fewer" });
            }
            user.name = name.trim();
        }

        user.updatedAt = Date.now();
        await user.save();

        return res.status(200).json({
            message: "User profile updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Username is already taken" });
        }
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
    const { token } = req.query;

    try {
        const currentUser = await User.findOne({ token });

        if (!currentUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const users = await User.find({
            _id: { $ne: currentUser._id }
        });

        const usersWithConnectionStatus = await Promise.all(
            users.map(async (user) => {

                const connection = await Connection.findOne({
                    $or: [
                        {
                            userId: currentUser._id,
                            connectionId: user._id
                        },
                        {
                            userId: user._id,
                            connectionId: currentUser._id
                        }
                    ]
                });

                let connectionStatus = "none";

                if (connection) {
                    if (connection.status_accepted === true) {
                        connectionStatus = "connected";
                    } else {
                        // Request exists but not accepted
                        if (connection.userId.toString() === currentUser._id.toString()) {
                            connectionStatus = "pending";
                        } else {
                            connectionStatus = "incoming";
                        }
                    }
                }

                return {
                    ...user.toObject(),
                    connectionStatus
                };
            })
        );

        return res.status(200).json({
            message: "Users retrieved successfully",
            users: usersWithConnectionStatus
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to retrieve users",
            error: error.message
        });
    }
};

const downloadResume = async (req, res) => {
    const user_id = req.query.userId;
    const userProfile = await Profile.findOne({ userId: user_id }).populate('userId', 'name email username profilePicture');
    let outputpath = await covertuserDataTOPDF(userProfile);
    return res.json({ message: "Resume downloaded successfully", resume: outputpath });
};

const uploadResume = async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({
        text: "Authentication token is required"
      });
    }

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({
        text: "Invalid token"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        text: "Please select a resume"
      });
    }

    user.resume = req.file.path.replace(/\\/g, "/");

    await user.save();

    return res.status(200).json({
      message: "Resume uploaded successfully",
      resume: user.resume
    });

  } catch (error) {
    return res.status(500).json({
      text: "Resume upload failed",
      error: error.message
    });
  }
};

export const removeResume = async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({
        text: "Authentication token is required"
      });
    }

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({
        text: "Invalid token"
      });
    }

    user.resume = "";

    await user.save();

    return res.status(200).json({
      message: "Resume removed successfully"
    });

  } catch (error) {
    return res.status(500).json({
      text: "Could not remove resume",
      error: error.message
    });
  }
};


const sendConnectionRequest = async (req, res) => {
    const { token, connectionId } = req.body;

    try {
        const currentUser = await User.findOne({ token });
        const connectionUser = await User.findById(connectionId);

        if (!currentUser) {
            return res.status(404).json({
                message: "Sender user not found"
            });
        }

        if (!connectionUser) {
            return res.status(404).json({
                message: "Receiver user not found"
            });
        }

        const existingRequest = await Connection.findOne({
            userId: currentUser._id,
            connectionId: connectionUser._id
        });

        if (existingRequest) {
            return res.status(400).json({
                message: "Connection request already sent"
            });
        }

        const newRequest = new Connection({
            userId: currentUser._id,
            connectionId: connectionUser._id,
            status_accepted: false
        });

        await newRequest.save();

        return res.status(200).json({
            message: "Connection request sent successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to send connection request",
            error: error.message
        });
    }
};

const getMyConnectionsRequests = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }

    try {
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connectionRequests = await Connection.find({
            connectionId: user._id,
            status_accepted: false
        }).populate(
            "userId",
            "name email username profilePicture"
        );

        return res.status(200).json({
            message: "Connection requests retrieved successfully",
            requests: connectionRequests
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to retrieve connection requests",
            error: error.message
        });
    }
};

const whatAreMyConnections = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const connections = await Connection.find({
            $or: [
                {
                    userId: user._id,
                    status_accepted: true
                },
                {
                    connectionId: user._id,
                    status_accepted: true
                }
            ]
        })
        .populate(
            "userId",
            "name email username profilePicture"
        )
        .populate(
            "connectionId",
            "name email username profilePicture"
        );

        return res.status(200).json({
            message: "Connections retrieved successfully",
            connections
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to retrieve connections",
            error: error.message
        });
    }
};

const acceptConnectionRequest = async (req, res) => {
    const { token, requestId } = req.body;

    try {
        const user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const connection = await Connection.findOne({
            _id: requestId,
            connectionId: user._id,
            status_accepted: false
        });

        if (!connection) {
            return res.status(404).json({
                message: "Connection request not found"
            });
        }

        connection.status_accepted = true;

        await connection.save();

        return res.status(200).json({
            message: "Connection request accepted",
            connection
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to accept connection request",
            error: error.message
        });
    }
};

const rejectConnectionRequest = async (req, res) => {
    const { token, requestId } = req.body;

    try {
        const user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const connection = await Connection.findOne({
            _id: requestId,
            connectionId: user._id,
            status_accepted: false
        });

        if (!connection) {
            return res.status(404).json({
                message: "Connection request not found"
            });
        }

        await Connection.findByIdAndDelete(requestId);

        return res.status(200).json({
            message: "Connection request rejected"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to reject connection request",
            error: error.message
        });
    }
};

// 1) In backend/controllers/user.controller.js, REPLACE the whole getUserProfileBasedonUsername
//    function with this one (same name, same export, route unchanged):

const getUserProfileBasedonUsername = async (req, res) => {
    // The existing frontend action sends username and token as query parameters
    const { username, token } = req.query;
    try {
        // Only logged-in users can view profiles
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const viewer = await User.findOne({ token });
        if (!viewer) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        const escaped = String(username).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const user = await User.findOne({ username: new RegExp("^" + escaped + "$", "i") })
            .select("name username profilePicture resume");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Email, password and token are never sent to other users
        const userProfile = await Profile.findOne({ userId: user._id })
            .populate("userId", "name username profilePicture resume");

        const profile = userProfile
            ? userProfile.toObject()
            : { userId: user.toObject(), bio: "", currentwork: {}, postwork: [], education: [] };

        return res.status(200).json({ message: "User profile retrieved successfully", user: profile });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve user profile", error: error.message });
    }
};

// 2) In getAllUsers (same file), change ONLY this one line:
//
//    before:  const users = await User.find({ _id: { $ne: currentUser._id } });
//    after:   const users = await User.find({ _id: { $ne: currentUser._id } }).select("-password -token");

export { uploadResume, activecheck, register, login, uploadprofilepicture, updateProfileData, getUserAndProfile, updateUserProfile, getAllUsers, downloadResume, sendConnectionRequest, acceptConnectionRequest, getMyConnectionsRequests, whatAreMyConnections, rejectConnectionRequest, getUserProfileBasedonUsername };