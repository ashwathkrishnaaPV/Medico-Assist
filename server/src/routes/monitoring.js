const router = require('express').Router();
const auth = require('../middleware/auth');
const { getModel } = require('../models/provider');

router.get('/plans', auth, async (req, res) => {
  try {
    const MonitoringPlan = getModel('MonitoringPlan');
    const filter = req.query.studentId ? { studentId: req.query.studentId } : {};
    const plans = await MonitoringPlan.find(filter);
    res.json(plans);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/plans', auth, async (req, res) => {
  try {
    const MonitoringPlan = getModel('MonitoringPlan');
    const plan = await MonitoringPlan.findOneAndUpdate(
      { studentId: req.body.studentId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(plan);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/responses', auth, async (req, res) => {
  try {
    const MonitoringResponse = getModel('MonitoringResponse');
    const filter = req.query.studentId ? { studentId: req.query.studentId } : {};
    const responses = await MonitoringResponse.find(filter);
    res.json(responses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/responses', auth, async (req, res) => {
  try {
    const MonitoringResponse = getModel('MonitoringResponse');
    const response = await MonitoringResponse.create(req.body);
    res.json(response);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
