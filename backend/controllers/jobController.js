import asyncHandler from "express-async-handler";
import Badge from "../models/badgeModel.js";
import Job from "../models/jobModel.js";
import User from "../models/userModel.js";

// @desc    Fetch all jobs
// @route   GET /api/jobs/get-jobs
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
	try {
		const keyword = req.query.keyword || "";

		// Build the query to search for jobs
		const query = {
			$or: [
				{ title: { $regex: keyword, $options: "i" } },
				{ description: { $regex: keyword, $options: "i" } },
			],
		};

		// Fetch jobs from the database
		const jobs = await Job.find(query)
			.populate({
				path: "badges", // Adjust the populate path if required
			})
			.populate({
				path: "company", // Adjust the populate path if required
			})
			.sort({ createdAt: -1 });

		// If no jobs found, return a 404 response
		if (!jobs || jobs.length === 0) {
			return res.status(404).json({
				message: "Jobs not found",
				success: false,
			});
		}
		console.log("sent");
		// Return the list of jobs with a 200 response
		return res.status(200).json({
			jobs,
			success: true,
		});
	} catch (error) {
		console.error("Error fetching jobs:", error);
		return res.status(500).json({
			message: "Server error occurred",
			success: false,
		});
	}
});

// @desc    Post a job
// @route   POST /api/jobs/get-jobs
// @access  Authenticated
const postJobs = asyncHandler(async (req, res) => {
	try {
		const { title, description, stipend, duration, location, position, minqualification, badges, startsOn, category } = req.body;

		console.log(title, description, stipend, duration, location, position, minqualification, badges, startsOn, category);

		const userId = req.user._id;
		console.log(userId);
		if (!userId) {
			return res.status(400).json({
				message: "user not logged in",
				success: false,
			});
		}

		const badgeIds = await Promise.all(
      badges.map(async (badgeTitle) => {
        const badge = await Badge.findOne({ title: badgeTitle });
        if (!badge) throw new Error(`Badge "${badgeTitle}" not found`);
        return badge._id;
      })
    );

		if (!title || !description || !startsOn || !category || !stipend || !duration || !location || !position || !minqualification) {
			return res.status(400).json({
				message: "Something is missing",
				success: false,
			});
		}

		const company = (await User.findById(userId)).company; // Finding the user company

		if (!company) {
			return res.status(400).json({
				message: "Company not registered for user",
				success: false,
			});
		}

		try {
			if (badges && badges.length > 0) {
				const badgeDocs = await Badge.find({ _id: { $in: badges } });
				if (badgeDocs.length !== badges.length) {
					return res.status(400).json({ message: "selected badge not available" });
				}
			}
		} catch (error) {
			console.log(error);
		}

		const job = await Job.create({
			title,
			description,
			createdby: userId,
			stipend,
			duration,
			location,
			position,
			minqualification,
			company, // Company is a required parameter in database
			category,
			startsOn,
			badges: badgeIds,
		});

		job.save();

		return res.status(201).json({
			message: "New job created successfully",
			job,
			success: true,
		});
	} catch (error) {
		console.log(error);
	}
});

const editJob = asyncHandler(async (req, res) => {
	try {
		const jobId = req.params.id;
		const { title, description, stipend, duration, location, position, minqualification, badges, startsOn, category } = req.body;

		console.log(title, description, stipend, duration, location, position, minqualification, badges, startsOn, category);

		const userId = req.user._id;

		let badgeIds;
		if (badges) {
			badgeIds = await Promise.all(
				badges.map(async (badgeTitle) => {
				const badge = await Badge.findOne({ title: badgeTitle });
				if (!badge) throw new Error(`Badge "${badgeTitle}" not found`);
				return badge._id;
			}));
		}

		const company = (await User.findById(userId)).company; // Finding the user company

		if (!company) {
			return res.status(400).json({
				message: "Company not registered for user",
				success: false,
			});
		}
		console.log(badgeIds);

		try {
			if (badgeIds?.length > 0) {
				const badgeDocs = await Badge.find({ _id: { $in: badgeIds } });
				if (badgeDocs.length !== badges.length) {
					return res.status(400).json({ message: "selected badge not available" });
				}
			}
		} catch (error) {
			console.log(error);
		}

		const job = await Job.findById(jobId);
		if (!job) {
			return res.status(404).json({
				message: "Job not found",
				success: false,
			});
		}

		if (job.createdby.toString() !== userId.toString()) {
			return res.status(403).json({
				message: "Unauthorized: Only the job creator can update this job",
				success: false,
			});
		}
		
		await job.updateOne(
			{
				$set: {
					title,
					description,
					stipend,
					duration,
					location,
					position,
					minqualification,
					company, // Company is a required parameter in database
					category,
					startsOn,
					badges: badgeIds,
				},
			}
		);

		return res.status(201).json({
			message: "Job Updated successfully",
			job,
			success: true,
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			message: "Server error",
			success: false,
		});
	}
});


// @desc fetch job details
// @route GET /api/jobs/info-jobs/:id
// @access Public
const infoJobs = asyncHandler(async (req, res) => {
	try {
	  const jobId = req.params.id;
	  const job = await Job.findById(jobId)
		.populate({
		  path: "application",
		})
		.populate({
			path: "company",
		})
		.populate({
		  path: "badges",
		  select: "title imageUrl" // Make sure to select the imageUrl field
		});
		
	  if (!job) {
		return res.status(404).json({
		  message: "Jobs not found.",
		  success: false,
		});
	  }
	  
	  return res.status(200).json({ job, success: true });
	} catch (error) {
	  console.log(error);
	  return res.status(500).json({
		message: "Server error",
		success: false,
	  });
	}
  });
  
  

// @desc    fetch all jobs as an admin
// @route   GET /api/jobs/admin-jobs
// @access  Admin
const adminJobs = asyncHandler(async (req, res) => {
	try {
		const adminId = req.user._id;
		const jobs = await Job.find({ createdby: adminId })
		.populate({path: "badges", select: "title"})
		.populate({path: "company"})
		.populate({path: "application"});
		if (!jobs) {
			return res.status(404).json({
				message: "Jobs not found.",
				success: false,
			});
		}
		return res.status(200).json({
			jobs,
			success: true,
		});
	} catch (error) {
		console.log(error);
	}
});

const isEligible = asyncHandler(async (req, res) => {
	try {
		const userId = req.user._id;
		const jobId = req.params.jobId;

		// Validate job ID
		if (!jobId) {
			return res.status(400).json({
				message: "Job ID is required",
				success: false,
			});
		}

		const job = await Job.findById(jobId);
		if (!job) {
			return res.status(404).json({
				message: "Job not found",
				success: false,
			});
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				message: "User not found",
				success: false,
			});
		}

		const requiredBadges = job.badges || [];
		const userBadges = user.badges || [];
		const hasAllBadges = requiredBadges.every((badge) => userBadges.includes(badge));

		return res.status(200).json({
			success: true,
			isEligible: hasAllBadges,
		});
	} catch (error) {
		console.log(error);
	}
});



// Toggle Job Active Status Controller
const toggleJobStatus = asyncHandler(async (req, res) => {
  try {
    const jobId = req.params.id;
		console.log(jobId);
    const userId = req.user._id;
		console.log(userId);

    // Find the job by ID
    const job = await Job.findById(jobId);

    // Check if job exists
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    } 

    // Ensure the logged-in user is the creator of the job
    if (job.createdby.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Unauthorized: Only the job creator can update this job",
        success: false,
      });
    }

    // Toggle the active status
    job.active = !job.active;

    // Save the updated job
    await job.save();

    return res.status(200).json({
      message: `Job status updated to ${job.active ? "active" : "inactive"}`,
      job,
      success: true,
    });
  } catch (error) {
    console.error(`Error updating job status: ${error.message}`);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
});




// Delete Job Controller
const deleteJob = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;
		console.log(id, userId);

    // Find the job by ID
    const job = await Job.findById(id);

    // Check if job exists
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    // Ensure the logged-in user is the creator of the job
    if (job.createdby.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Unauthorized: Only the job creator can delete this job",
        success: false,
      });
    }

    // Delete the job
    await job.deleteOne();

    return res.status(200).json({
      message: "Job deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error(`Error deleting job: ${error.message}`);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
});



export { adminJobs, getJobs, infoJobs, isEligible, editJob, postJobs, deleteJob, toggleJobStatus };
