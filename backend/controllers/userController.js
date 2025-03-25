import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email });

	if (user && (await user.matchPassword(password))) {
		generateToken(res, user._id);

		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			resume: user.resume,
			company: user.company,
		});
	} else {
		res.status(401);
		throw new Error("Invalid email or password");
	}
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
	const { name, email, password, phone } = req.body;

	const userExists = await User.findOne({ email });

	if (userExists) {
		res.status(400);
		throw new Error("User already exists");
	}

	const user = await User.create({
		name,
		email,
		password,
		phone,
	});

	if (user) {
		generateToken(res, user._id);

		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
		});
	} else {
		res.status(400);
		throw new Error("Invalid user data");
	}
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
	res.cookie("jwt", "", {
		httpOnly: true,
		expires: new Date(0),
	});
	res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id).populate("badges").populate({path:"company", select: "name"});
	
	if (user) {
		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			badges: user.badges,
			resume: user.resume,
			company: user.company,
			registrationNo: user.registrationNo,
			branch: user.branch,
			currentYear: user.currentYear,
			introduction: user.introduction
		});
	} else {
		res.status(404);
		throw new Error("User not found");
	}
});

// @desc    Get any user's profile by ID
// @route   GET /api/users/profile/:id
// @access  Public
const getUserProfileById = asyncHandler(async (req, res) => {
	// Added another route where any one can see a user's profile without needing login
	const user = await User.findById(req.params.id).populate("badges");

	if (user) {
		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			resume: user.resume,
			registrationNo: user.registrationNo,
			branch: user.branch,
			currentYear: user.currentYear,
			introduction: user.introduction,
			badges: user.badges,
			company: user.company,
		});
	} else {
		res.status(404);
		throw new Error("User not found");
	}
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id);

	if (user) {
		user.name = req.body.name || user.name;
		user.email = req.body.email || user.email;
		user.phone = req.body.phone || user.phone;
		user.resume = req.body.resume || user.resume;
		user.registrationNo = req.body.registrationNo || user.registrationNo;
		user.branch = req.body.branch || user.branch;
		user.currentYear = req.body.currentYear || user.currentYear;
		user.introduction = req.body.introduction || user.introduction;

		if (req.body.password) {
			user.password = req.body.password;
		}

		const updatedUser = await user.save();

		res.json({
			_id: updatedUser._id,
			name: updatedUser.name,
			phone: updatedUser.phone,
			email: updatedUser.email,
			resume: updatedUser.resume,
			registrationNo: updatedUser.registrationNo,
			branch: updatedUser.branch,
			currentYear: updatedUser.currentYear,
			introduction: updatedUser.introduction,
		});
	} else {
		res.status(404);
		throw new Error("User not found");
	}
});

export { authUser, getUserProfile, getUserProfileById, logoutUser, registerUser, updateUserProfile };
