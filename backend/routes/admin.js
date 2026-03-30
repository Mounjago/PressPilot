/**
 * ROUTES ADMIN
 * Toutes les routes sont protegees par auth + requireAdmin
 * Accessibles uniquement aux roles admin et super_admin
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleGuard');
const adminController = require('../controllers/adminController');

// Middleware applique a toutes les routes admin
const adminAuth = [auth, requireAdmin];

// ============================================================
// STATISTIQUES
// ============================================================
router.get('/stats', ...adminAuth, adminController.getGlobalStats);
router.get('/analytics', ...adminAuth, adminController.getCrossWorkspaceAnalytics);

// ============================================================
// GESTION DES UTILISATEURS
// ============================================================
router.get('/users', ...adminAuth, adminController.getUsers);
router.get('/users/:id', ...adminAuth, adminController.getUserById);
router.post('/users', ...adminAuth, adminController.createUser);
router.put('/users/:id', ...adminAuth, adminController.updateUser);
router.put('/users/:id/role', ...adminAuth, adminController.changeUserRole);
router.put('/users/:id/lock', ...adminAuth, adminController.toggleUserLock);
router.delete('/users/:id', ...adminAuth, adminController.deleteUser);

// ============================================================
// GESTION DES ORGANISATIONS
// ============================================================
router.get('/organizations', ...adminAuth, adminController.getOrganizations);
router.get('/organizations/:id', ...adminAuth, adminController.getOrganizationById);
router.post('/organizations', ...adminAuth, adminController.createOrganization);
router.put('/organizations/:id', ...adminAuth, adminController.updateOrganization);
router.delete('/organizations/:id', ...adminAuth, adminController.deleteOrganization);

module.exports = router;
