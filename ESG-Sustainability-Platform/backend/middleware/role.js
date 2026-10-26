// Usage: authorize("admin", "esg_manager")
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized");
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not authorized to access this resource`);
    }
    next();
  };
};

module.exports = { authorize };
