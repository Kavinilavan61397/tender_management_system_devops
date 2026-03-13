const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    verifyUser,
    rejectUser,
    deleteUser,
    createEmployee
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require auth + admin
router.use(protect);
router.use(admin);

router.get('/', getUsers);
router.post('/create-employee', createEmployee);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/verify', verifyUser);
router.put('/:id/reject', rejectUser);

module.exports = router;
