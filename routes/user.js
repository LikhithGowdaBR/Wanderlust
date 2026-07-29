const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/user.js");

//form
router.get("/signup", userController.renderSignupForm);

//signup
router.post("/signup", wrapAsync(userController.signup));

//login
router.get("/login", userController.renderLoginForm);

router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    //checks whether the user login or not
    failureRedirect: "/login",
    failureFlash: true,
  }),
  userController.login,
);

router.get("/logout", userController.logout);

module.exports = router;
