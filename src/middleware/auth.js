const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const Customer = require("../models/customer");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Admin.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      const customer = await Customer.findOne({
        _id: decoded._id,
        "tokens.token": token,
      });
      if (!customer) {
        throw new Error();
      } else {
        req.token = token;
        req.user = customer;
        next();
      }
    } else {
      req.token = token;
      req.user = user;
      next();
    }
  } catch (e) {
    res.status(401).json({ msg: "Please authenticate." });
  }
};

module.exports = auth;
