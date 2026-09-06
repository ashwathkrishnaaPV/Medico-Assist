const router = require('express').Router();
const auth = require('../middleware/auth');
const { getModel } = require('../models/provider');

router.get('/', auth, async (req, res) => {
  try {
    const Model = getModel('NutritionPlan');
    const filter = req.query.studentId ? { studentId: req.query.studentId } : {};
    const items = await Model.find(filter);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const Model = getModel('NutritionPlan');
    const item = await Model.create(req.body);
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const Model = getModel('NutritionPlan');
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
