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
  verify(req.body.token)
    .then((user) => getOrCreateUser(user))
    .then((user) => {
      // persist user in the session
      req.session.user = user;
      res.send(user);
    })
    .catch((err) => {
      console.log(`Failed to log in: ${err}`);
      res.status(401).send({ err });
    });
}

function logout(req, res) {
  req.session.user = null;
  res.send({});
}

function populateCurrentUser(req, res, next) {
  // simply populate "req.user" for convenience
  req.user = req.session.user;
  next();
}

function ensureLoggedIn(req, res, next) {
  if (!req.session || !req.session.user) {
    console.log("❌ Auth check failed - no session or user");
    return res.status(401).send({ err: "not logged in" });
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
