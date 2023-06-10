const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({
    posts: {
      title: "secured data",
      description: "Secured data. Must be authenticated to access me...",
    },
  });
});

router.get("/test", (req, res) => {
  res.json({
    posts: {
      title: "secured data 2",
      description: "(2) Secured data. Must be authenticated to access me...",
      user: req.user,
    },
  });
});

module.exports = router;
