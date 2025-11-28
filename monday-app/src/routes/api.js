const express = require('express');
const router = express.Router();
const mondayService = require('../services/mondayService');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/boards', async (req, res) => {
  try {
    const boards = await mondayService.getBoards(req.user.mondayToken);
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

router.get('/items/:boardId', async (req, res) => {
  try {
    const items = await mondayService.getItems(req.params.boardId, req.user.mondayToken);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

module.exports = router;
