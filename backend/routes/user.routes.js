import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { register, uploadprofilepicture, login, updateUserProfile, getUserAndProfile, updateProfileData, getAllUsers, downloadResume, sendConnectionRequest, getMyConnectionsRequests, whatAreMyConnections, acceptConnectionRequest, rejectConnectionRequest,getUserProfileBasedonUsername,uploadResume, removeResume } from '../controllers/user.controller.js';

const router = Router();
const uploadDir = 'profile/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.route('/update-profile').post(upload.single('profile_picture'), uploadprofilepicture);
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/user_update').post(updateUserProfile);
router.route('/get_user_and_profile').get(getUserAndProfile);
router.route('/update_profile_data').post(updateProfileData);
router.route('/get_all_users').get(getAllUsers);
router.route('/download_resume').get(downloadResume);
router.route("/upload_resume").post(upload.single("resume"), uploadResume);
router.route("/remove_resume").delete(removeResume);
router.route('/send_connection_request').post(sendConnectionRequest);
router.get('/get_my_connections', getMyConnectionsRequests);
router.route('/what_are_my_connections').get(whatAreMyConnections);
router.route('/accept_connection_request').post(acceptConnectionRequest);
router.route('/reject_connection_request').post(rejectConnectionRequest);
router.route('/get_user_profile_based_on_username').get(getUserProfileBasedonUsername);

export default router;