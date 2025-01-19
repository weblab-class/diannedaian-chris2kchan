const express=require("express");
const Dream = require("../models/dream");
const router = express.Router();


// get request to fetch dreams for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const dreams = await Dream.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(dreams);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dreams" });
  }
});



//post request to add a new dream
router.post("/add," async (req, res) => {
    const { userId, content, interpretation, imageUrl } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newDream = new Dream({
      userId,
      content,
      interpretation,
      imageUrl,
    });

    await newDream.save();
    res.status(201).json(newDream);
  } catch (error) {
    res.status(500).json({ error: "Failed to save dream" });
  }
});


module.exports = router;
