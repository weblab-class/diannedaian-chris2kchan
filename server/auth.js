const { OAuth2Client } = require("google-auth-library");
const User = require("./models/user");
const Profile = require("./models/profile");
const socketManager = require("./server-socket");

// create a new OAuth client used to verify google sign-in
//    TODO: replace with your own CLIENT_ID
const CLIENT_ID = "99548937462-ju96p61ngch1n4qt79iq076ltvjnfcv6.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// accepts a login token from the frontend, and verifies that it's legit
function verify(token) {
  return client
    .verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    })
    .then((ticket) => ticket.getPayload());
}

// gets user from DB, or makes a new account if it doesn't exist yet
async function getOrCreateUser(user) {
  // the "sub" field means "subject", which is a unique identifier for each user
  const existingUser = await User.findOne({ googleid: user.sub });
  
  if (existingUser) {
    // Update existing user's info in case it changed
    existingUser.name = user.name;
    existingUser.picture = user.picture;
    return existingUser.save();
  }

  const newUser = new User({
    name: user.name,
    googleid: user.sub,
    picture: user.picture,
  });

  // Create a profile for the new user
  const newProfile = new Profile({
    userId: user.sub,
    displayName: "Dreamer",
  });

  await newProfile.save();
  return newUser.save();
}

function login(req, res) {
  console.log("🔑 Starting login process");
  verify(req.body.token)
    .then((user) => {
      console.log("✅ Token verified for user:", user.email);
      return getOrCreateUser(user);
    })
    .then((user) => {
      // persist user in the session
      req.session.user = user;
      console.log("✅ User saved to session:", user._id);
      console.log("Session ID:", req.session.id);
      console.log("Session data:", req.session);
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("❌ Error saving session:", err);
          res.status(500).send({ error: "Failed to save session" });
        } else {
          console.log("✅ Session saved successfully");
          res.send(user);
        }
      });
    })
    .catch((err) => {
      console.error("❌ Login failed:", err);
      res.status(401).send({ error: err.message });
    });
}

function logout(req, res) {
  console.log("👋 Logging out user:", req.session?.user?.name);
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Error destroying session:", err);
      res.status(500).send({ error: "Failed to logout" });
    } else {
      console.log("✅ Session destroyed successfully");
      res.clearCookie("connect.sid");
      res.send({});
    }
  });
}

function populateCurrentUser(req, res, next) {
  console.log("🔍 Populating current user");
  console.log("Session ID:", req.session?.id);
  console.log("Session user:", req.session?.user);
  req.user = req.session?.user;
  next();
}

function ensureLoggedIn(req, res, next) {
  console.log("🔒 Checking authentication");
  console.log("Session present:", !!req.session);
  console.log("Session ID:", req.session?.id);
  console.log("Session user:", req.session?.user);
  console.log("Cookies:", req.headers.cookie);
  
  if (!req.session || !req.session.user) {
    console.error("❌ Auth check failed - no session or user");
    return res.status(401).send({ error: "not logged in" });
  }

  req.user = req.session.user;
  console.log("✅ Auth check passed for user:", req.user.name);
  next();
}

module.exports = {
  login,
  logout,
  populateCurrentUser,
  ensureLoggedIn,
};
