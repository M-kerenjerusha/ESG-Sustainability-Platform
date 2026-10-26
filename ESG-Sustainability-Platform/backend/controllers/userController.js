const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate("department", "name").populate("facility", "name").sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate("department", "name").populate("facility", "name");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, data: user });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, facility } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }
  const user = await User.create({ name, email, password, role, department, facility });
  res.status(201).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, role, department, facility, isActive, password } = req.body;

  // Prevent admin from deactivating or demoting their own active session
  if (req.user && req.user._id.toString() === req.params.id) {
    if (typeof isActive === "boolean" && !isActive) {
      res.status(400);
      throw new Error("You cannot deactivate your own account.");
    }
    if (role && role !== "admin") {
      res.status(400);
      throw new Error("You cannot demote your own admin account.");
    }
  }

  if (name) user.name = name;
  if (role) user.role = role;
  if (department !== undefined) user.department = department || null;
  if (facility !== undefined) user.facility = facility || null;
  if (typeof isActive === "boolean") user.isActive = isActive;
  if (password) user.password = password;

  await user.save();
  res.json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.user && req.user._id.toString() === req.params.id) {
    res.status(400);
    throw new Error("You cannot delete your own account.");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  await user.deleteOne();
  res.json({ success: true, message: "User deleted" });
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
