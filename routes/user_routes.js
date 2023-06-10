const router = require("express").Router();
const { Router } = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user_model");
const utils = require("../utils/utils");
const multer = require("multer");
const passport = require("passport");
const crypto = require("crypto");

// Setting up multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/profile_pictures");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      crypto.randomBytes(5).toString("hex") +
      Date.now() +
      crypto.randomBytes(5).toString("hex");
    cb(null, file.fieldname + "_" + uniqueSuffix + ".jpg");
  },
});
const image = multer({ storage: storage });

// To send OTP on the given number
router.post("/send-otp", async (req, res) => {
  const phoneNumber = req.body.phone;
  console.log("Number is :::::::::: " + phoneNumber);
  var otp = await utils.sendOtp(phoneNumber);
  var auth_key = await utils.encrypt(otp);
  console.log("OTP is :::::::::: " + otp);
  if (otp != null) {
    res.status(200).json({
      status: true,
      auth_key,
      message: "OTP sent successfully",
    });
  } else {
    res.status(200).json({
      status: false,
      message: "email already exist",
    });
  }
});

// To verify otp submitted by user
router.post("/verify-otp", async (req, res) => {
  const phoneNumber = "+91" + req.body.phone;
  const submittedOtp = req.body.otp;
  const originalAuthKey = req.body.auth_key;
  const isVerified = await utils.compareEncrypt(originalAuthKey, submittedOtp);
  const user = await phoneExistInDb(phoneNumber);
  if (isVerified) {
    if (user.status) {
      //assigning a jwt token
      const token = jwt.sign({ _id: user.body._id }, process.env.JWT_SECRET);
      res.status(200).json({
        status: true,
        message: "successfully logged in",
        new_user: false,
        token: "Bearer " + token,
        user: user.body,
      });
    } else {
      try {
        const user = User({
          phone: phoneNumber,
        });

        var newUser = await user.save();
        console.log(newUser);

        //assigning a jwt token
        const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET);

        res.status(200).json({
          status: true,
          message: "user successfully created",
          new_user: true,
          token: "Bearer " + token,
          user: newUser,
        });
      } catch (error) {
        res.status(500).json({
          status: false,
          message: error.message,
        });
        console.log("err : " + error.message);
      }
    }
  } else {
    res.status(406).json({
      status: false,
      message: "incorrect OTP",
    });
  }
});

// router.post("/register", async (req, res) => {
//   const encryptedPassword = await utils.encrypt(req.body.password);
//   const emailExist = await emailExistInDb(req.body.email);
//   if (emailExist.status) {
//     res.json({
//       status: false,
//       message: "email already exist",
//       user: emailExist.body,
//     });
//   } else {
//     try {
//       const user = User({
//         name: req.body.name,
//         email: req.body.email,
//         password: encryptedPassword,
//       });

//       var newUser = await user.save();
//       console.log(newUser);

//       //assigning a jwt token
//       const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET);

//       res.status(201).json({
//         status: true,
//         message: "user successfully created",
//         token: "Bearer " + token,
//         user: newUser,
//       });
//     } catch (error) {
//       res.status(500).json({
//         status: false,
//         message: error.message,
//       });
//       console.log("err : " + error.message);
//     }
//   }
// });

// router.post("/login", async (req, res) => {
//   try {
//     const user = await emailExistInDb(req.body.email);

//     if (user.status) {
//       if (await utils.compareEncrypt(user.body.password, req.body.password)) {
//         //assigning a jwt token
//         const token = jwt.sign({ _id: user.body._id }, process.env.JWT_SECRET);
//         res.status(200).json({
//           status: true,
//           message: "successfully logged in",
//           token: "Bearer " + token,
//           user: user.body,
//         });
//       } else {
//         res.status(406).json({
//           status: false,
//           message: "incorrect password",
//         });
//       }
//     } else {
//       res.json({
//         status: false,
//         message: "email not exist",
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//     console.log("err : " + error.message);
//   }
// });

// To upload or edit profile picture
router.post(
  "/add-dp",
  [passport.authenticate("jwt", { session: false }), image.single("file")],
  async (req, res) => {
    console.log(req.file.path);
    const details = {
      profile_pic: req.file.path,
    };
    try {
      await User.findByIdAndUpdate(req.user.id, details);
      res.status(200).json({
        status: true,
        message: "Profile picture updated successfully",
      });
    } catch (error) {
      console.log("err: " + error);
      res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }
);

// To edit profile details

router.post(
  "/update-details/:field",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const fieldValue = req.params.field;

    try {
      switch (fieldValue) {
        case "user": {
          const userDetails = {
            name: req.body.name,
            email: req.body.email,
            dob: Date(req.body.dob),
            profile_pic: req.body.profile_pic,
            state: req.body.state,
            city: req.body.city,
          };

          await User.findByIdAndUpdate(req.user.id, userDetails);

          res.status(200).json({
            status: true,
            message: "User updated successfully",
          });
          break;
        }

        case "resume": {
          const resumeDetails = {
            bio: req.body.bio,
            category: req.body.category,
            expertise: req.body.expertise,
            startup_count: req.body.startup_count,
            skills: req.body.skills,
            has_startup: req.body.has_startup,
          };

          await User.findByIdAndUpdate(req.user.id, {
            $set: {
              resume: resumeDetails,
            },
          });

          res.status(200).json({
            status: true,
            message: "User updated successfully",
          });
          break;
        }

        case "startup": {
          const startupDetails = {
            name: req.body.name,
            legal_name: req.body.legal_name,
            tagline: req.body.tagline,
            industry: req.body.industry,
            date_founded: Date(req.body.date_founded),
            kv_incubation_id: req.body.kv_incubation_id,
          };

          await User.findByIdAndUpdate(req.user.id, {
            $set: {
              startup: startupDetails,
            },
          });

          res.status(200).json({
            status: true,
            message: "User updated successfully",
          });
          break; 
        }

        default: {
          res.status(400).json({
            status: false,
            message: "Nested field value not found.",
          });
          break;
        }
      }
    } catch (error) {
      console.log("err: " + error);
      res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }
);

async function phoneExistInDb(phone) {
  try {
    var userData = await User.findOne({ phone });
    return {
      status: userData == null ? false : true,
      body: userData,
    };
  } catch (error) {
    console.log("err: " + error);
  }
}
// async function emailExistInDb(email) {
//   try {
//     var userData = await User.findOne({ email: email });
//     return {
//       status: userData == null ? false : true,
//       body: userData,
//     };
//   } catch (error) {
//     console.log("err: " + error);
//     res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// }

module.exports = router;
