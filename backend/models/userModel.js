import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Stronger constraints for database consistency
const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: [2, "Name must be at least 2 characters"],
			maxlength: [100, "Name cannot exceed 100 characters"],
		},
		phone: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		resume: {
			type: String,
			default: "",
		},
		registrationNo: {
			type: String,
			required: [true, "Registration number is required"],
			trim: true,
		  },
		  branch: {
			type: String,
			required: [true, "Branch is required"],
			trim: true,
		  },
		  currentYear: {
			type: String,
			required: [true, "Current year is required"],
			enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
		  },		  
		  introduction: {
			type: String,
			default: "",
		  },
		password: {
			type: String,
			required: true,
		},
		badges: {
			type: [
				{
					type: mongoose.Schema.ObjectId,
					ref: "Badge",
				},
			],
			default: [],
		},
		company: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Company",
		},
	},
	{
		timestamps: true,
	}
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		next();
	}

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
