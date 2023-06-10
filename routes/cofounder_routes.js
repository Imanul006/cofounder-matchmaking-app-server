const res = require("express/lib/response");
const { default: mongoose } = require("mongoose");
const interaction = require("../models/interaction_model");
const User = require("../models/user_model");
const helpers = require("../utils/helpers.js");

const router = require("express").Router();

/* Get requests */

// Get all or filtered user
router.get("/all", async (req, res) => {
  res.status(200).json(await paginatedResults(req));
});

// Get a user by id
router.get("/by-id", async (req, res) => {
  const id = req.query.id;
  res.status(200).json(await getUserById(id));
});

// List interactions by interaction type
router.get("/list-interactions", async (req, res) => {
  const interaction_type = req.query.interaction_type;
  if (interaction_type === "" || interaction_type == null) {
    res.status(200).json(await listAllInteractions(req.user.id));
  } else {
    res
      .status(200)
      .json(await listInteractionByType(req.user._id, interaction_type));
  }
});

// List all connections
router.get("/list-connections", async (req, res) => {
  res.status(200).json(await listAllConnections(req.user.id));
});

/* Post requests */

// Send request to specific user
router.post("/send-request", async (req, res) => {
  // If reciever currently rejected, undoing rejection
  if (
    isActionDone(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.rejected
    )
  ) {
    undoAction(req.user._id, req.body.id, helpers.interaction_choices.rejected);
  }

  const isSent = await sendRequest(req.user.id, req.body.id);
  if (isSent) {
    res.status(200).json({
      status: true,
      message: "request successfully sent",
    });
  } else {
    res.status(400).json({
      status: false,
      message: "uncaught error",
    });
  }
});

// Reject request of an specific user
router.post("/reject-request", async (req, res) => {
  const isRejected = await deleteRequest(req.body.id, req.user.id);
  if (isRejected) {
    res.status(200).json({
      status: true,
      message: "successfully rejected",
    });
  } else {
    res.status(400).json({
      status: false,
      message: "uncaught error",
    });
  }
});

// Unsend request of an specific user
router.post("/unsend-request", async (req, res) => {
  const isRejected = await deleteRequest(req.user.id, req.body.id);
  if (isRejected) {
    res.status(200).json({
      status: true,
      message: "successfully unsent",
    });
  } else {
    res.status(400).json({
      status: false,
      message: "uncaught error",
    });
  }
});

// Accept request of an specific user
router.post("/accept-request", async (req, res) => {
  const isAccepted = acceptRequest(req.user.id, req.body.id);
  if (isAccepted) {
    res.status(200).json({
      status: true,
      message: "successfully accepted request",
    });
  } else {
    res.status(400).json({
      status: false,
      message: "uncaught error",
    });
  }
});

// Remove connection from a specific user
router.post("/remove-connection", async (req, res) => {
  const isRemoved = removeConnection(req.user.id, req.body.id);
  if (isRemoved) {
    res.status(200).json({
      status: true,
      message: "successfully removed connection",
    });
  } else {
    res.status(400).json({
      status: false,
      message: "uncaught error",
    });
  }
});
// Like a specific user
router.post("/like", async (req, res) => {
  // If reciever currently rejected, undoing rejection
  if (
    isActionDone(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.rejected
    )
  ) {
    undoAction(req.user._id, req.body.id, helpers.interaction_choices.rejected);
  }

  // checking if already liked
  const isAlreadyDone = await isActionDone(
    req.user._id,
    req.body.id,
    helpers.interaction_choices.liked
  );
  console.log("isAlreadyDone = " + isAlreadyDone);
  if (!isAlreadyDone) {
    // Performing action
    const isSent = await sendActionByInteractionChoice(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.liked
    );
    if (isSent) {
      res.status(200).json({
        status: true,
        message: "successfully liked",
      });
    } else {
      res.status(400).json({
        status: false,
        message: "uncaught error",
      });
    }
  } else {
    // Unliking the user
    const isUndone = await undoAction(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.liked
    );
    if (isUndone) {
      res.status(200).json({
        status: true,
        message: "successfully unliked",
      });
    } else {
      res.status(400).json({
        status: false,
        message: "uncaught error",
      });
    }
  }
});

// Add specific user to reject list
router.post("/reject", async (req, res) => {
  // If reciever currently liked, unliking
  if (
    await isActionDone(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.liked
    )
  ) {
    await undoAction(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.liked
    );
  }

  if (
    await isActionDone(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.sent
    )
  ) {
    await undoAction(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.sent
    );
    await undoAction(
      req.body.id,
      req.user._id,
      helpers.interaction_choices.incoming
    );
  }

  // checking if already rejected
  const isAlreadyDone = await isActionDone(
    req.user._id,
    req.body.id,
    helpers.interaction_choices.rejected
  );
  console.log("isAlreadyDone = " + isAlreadyDone);
  if (!isAlreadyDone) {
    // Performing action
    const isSent = await sendActionByInteractionChoice(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.rejected
    );
    if (isSent) {
      res.status(200).json({
        status: true,
        message: "successfully rejected",
      });
    } else {
      res.status(400).json({
        status: false,
        message: "uncaught error",
      });
    }
  } else {
    // Undoing rejection for the user
    const isUndone = await undoAction(
      req.user._id,
      req.body.id,
      helpers.interaction_choices.rejected
    );
    if (isUndone) {
      res.status(200).json({
        status: true,
        message: "successfully undone rejection",
      });
    } else {
      res.status(400).json({
        status: false,
        message: "uncaught error",
      });
    }
  }
});

router.get("/list-interacted-users", async (req, res) => {
  const currentUserId = req.user.id;
  const interactionType = req.query.interaction_type;
  var interactedIds = [];
  var interactedUsers = [];

  if (interactionType === "connected") {
    interactedUsers = await listAllConnections(currentUserId);
    interactedUsers.forEach(element => {
      interactedIds.push(mongoose.Types.ObjectId(element.connected_with));
    });
  } else {
    interactedUsers = await listInteractionByType(currentUserId, interactionType);
    interactedUsers.forEach(element => {
      interactedIds.push(mongoose.Types.ObjectId(element.interacted_with));
    });
  }

  res.status(200).json(await listUsersByListOfIds(currentUserId, interactedIds));

});

/* Functions */

async function listUsersByListOfIds(currentUserId, ids) {
  try {
    results = await User.find({
      $and: [
        { name: { $exists: true } },
        { resume: { $exists: true } },
        { _id: { $ne: currentUserId } },
        { _id: { $in: ids } }
      ],
    });
  
  } catch (error) {
    throw "ERROR : " + error;
  }
  return results;
}

async function listAllInteractions(id) {
  try {
    const user = await User.findById(id);
    return await user.interactions;
  } catch (error) {
    return error;
  }
}

async function listAllConnections(id) {
  try {
    const user = await User.findById(id);
    return await user.connections;
  } catch (error) {
    return error;
  }
}

async function listInteractionByType(id, interaction_type) {
  try {
    const user = await User.findById(id);
    const filteredList = await user.interactions.filter(
      (interaction) => interaction.interaction_type === interaction_type
    );
    return filteredList;
  } catch (error) {
    return error;
  }
}

// To accept a request
async function acceptRequest(recieverId, senderId) {
  if (await deleteRequest(senderId, recieverId)) {
    const senderUpdates = {
      connected_with: recieverId,
      i_am_sender: true,
    };
    const recieverUpdates = {
      connected_with: senderId,
      i_am_sender: false,
    };

    try {
      await User.findByIdAndUpdate(senderId, {
        $push: {
          connections: senderUpdates,
        },
      });
    } catch (error) {
      throw "Sender Error : " + error;
    }
    try {
      await User.findByIdAndUpdate(recieverId, {
        $push: {
          connections: recieverUpdates,
        },
      });
    } catch (error) {
      console.log("Reciever Error : " + error);
      return false;
    }
    return true;
  } else {
    return false;
  }
}

// To remove a connection
async function removeConnection(id1, id2) {
  try {
    const res = await User.findByIdAndUpdate(id1, {
      $pull: {
        connections: {
          connected_with: id2,
        },
      },
    });
  } catch (error) {
    console.log("Error : " + error);
    return false;
  }

  try {
    const res = await User.findByIdAndUpdate(id2, {
      $pull: {
        connections: {
          connected_with: id1,
        },
      },
    });
  } catch (error) {
    console.log("Error : " + error);
    return false;
  }

  return true;
}

// To undo an action
async function undoAction(senderId, recieverId, action) {
  try {
    const res = await User.findByIdAndUpdate(
      senderId,
      {
        $pull: {
          interactions: {
            interacted_with: recieverId,
            interaction_type: action,
          },
        },
      },
      { new: true }
    );
    console.log("Res : " + JSON.stringify(res));
    return true;
  } catch (error) {
    console.log("Error : " + error);
    return false;
  }
}

// Checking if an action done already
async function isActionDone(senderId, recieverId, action) {
  try {
    const sender = await User.findById(senderId);
    for (var i = 0; i < sender.interactions.length; i++) {
      var element = sender.interactions[i];
      if (
        element.interacted_with === recieverId &&
        element.interaction_type === action
      ) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log("Sender Error : " + error);
    throw "ERROR : " + error;
  }
}

// Do an action by passing interaction choice
async function sendActionByInteractionChoice(senderId, recieverId, action) {
  const updates = {
    interaction_type: action,
    interacted_with: recieverId,
  };

  try {
    await User.findByIdAndUpdate(senderId, {
      $push: {
        interactions: updates,
      },
    });
    return true;
  } catch (error) {
    throw "ERROR : " + error;
  }
}

// Send request to a specific user
async function sendRequest(senderId, recieverId) {
  const senderUpdates = {
    interaction_type: helpers.interaction_choices.sent,
    interacted_with: recieverId,
  };
  const recieverUpdates = {
    interaction_type: helpers.interaction_choices.incoming,
    interacted_with: senderId,
  };
  try {
    await User.findByIdAndUpdate(senderId, {
      $push: {
        interactions: senderUpdates,
      },
    });
  } catch (error) {
    throw "Sender Error : " + error;
  }
  try {
    await User.findByIdAndUpdate(recieverId, {
      $push: {
        interactions: recieverUpdates,
      },
    });
  } catch (error) {
    console.log("Reciever Error : " + error);
    return false;
  }
  return true;
}

// Reject request to a specific user
async function deleteRequest(sender, reciever) {
  await undoAction(sender, reciever, helpers.interaction_choices.sent);
  await undoAction(reciever, sender, helpers.interaction_choices.incoming);
  return true;
}

// Get a user by his id
async function getUserById(id) {
  try {
    return await User.findById(id, "-password");
  } catch (error) {
    return error;
  }
}

// paginating search result
async function paginatedResults(req) {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  var query = null;
  if (req.query.query) {
    query = JSON.parse(req.query.query);
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = {};

  

  // if (endIndex < User.length) results.next = { page: page + 1, limit: limit };
  // else results.next = null;

  var rejectList = await listInteractionByType(req.user.id, "rejected");
  var rejectedIds = [];
  var finalResults = [];
  rejectList.forEach(element => {
    rejectedIds.push(mongoose.Types.ObjectId(element.interacted_with));
  });
   
  // const totalUser = await User.countDocuments({
  //   $or: [{ name: { $exists: true } }, { resume: { $exists: true } }],
  // });
  // results.totalPages = Math.ceil(totalUser / parseFloat(limit));
  

  try {
    results.results = await User.find({
      $and: [
        { name: { $exists: true } },
        { resume: { $exists: true } },
        { _id: { $ne: req.user.id } },
        { _id: { $nin: rejectedIds } }
      ],
    }).limit(limit).skip(startIndex);

      // results.results = await User.find({
      //   $and: [
      //     {
      //       $or: [{ name: { $exists: true } }, { resume: { $exists: true } }],
      //     },
      //     { _id: { $ne: req.user.id } },
      //   ],
      // })
      
      
  } catch (error) {
    throw "ERROR : " + error;
  }
  console.log(results);
  //results.results.filter(item => ((item.name === "" || item.name == null) && (item.resume === "" || item.resume == null)));
  // res.forEach(element => {
  //   if(!rejectedIds.includes(element._id)) {
  //     finalResults.push(element);
  //   }
  // });
  // const totalUser = finalResults.length;
  const totalUser = await User.countDocuments({
    $and: [
      { name: { $exists: true } },
      { resume: { $exists: true } },
      { _id: { $ne: req.user.id } },
      { _id: { $nin: rejectedIds } }
    ],
  });

  results.totalPages = Math.ceil(totalUser / parseFloat(limit));
  
  return results;
}

module.exports = router;
