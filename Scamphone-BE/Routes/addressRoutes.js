import express from 'express';
import { 
    getAddresses, 
    addAddress, 
    updateAddress, 
    deleteAddress,
    setDefaultAddress 
} from '../Controllers/addressController.js';
import { protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all addresses
router.get('/', getAddresses);

// Add new address
router.post('/', addAddress);

// Update address
router.put('/:addressId', updateAddress);

// Delete address
router.delete('/:addressId', deleteAddress);

// Set address as default
router.put('/:addressId/set-default', setDefaultAddress);

export default router;
