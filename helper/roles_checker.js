exports.isAdmin = (req, res, next) => {
  try {
    data = req.data;
    const roles = data.roles;

    if (roles.includes("admin")) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "only admin can access this route" });
    }
  } catch (error) {
    next(error);
  }
};
