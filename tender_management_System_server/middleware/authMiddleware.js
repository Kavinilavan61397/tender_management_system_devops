const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(req.user.role)) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const evaluator = (req, res, next) => {
    if (req.user && ['ADMIN', 'MANAGER', 'DIRECTOR', 'EVALUATOR'].includes(req.user.role)) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an evaluator/admin' });
    }
};

module.exports = { protect, admin, evaluator };
