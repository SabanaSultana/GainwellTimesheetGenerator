const AuditLog = require('../../models/auditLogModel');

const getAuditLogs = async (req, res) => {
  try {
    const { entityId, entityType, projectId } = req.query;

    const query = {};
    if (projectId)   query.projectId  = projectId;
    else if (entityId) query.entityId = entityId;
    if (entityType)  query.entityType = entityType;

    const logs = await AuditLog.find(query).sort({ editedAt: -1 }).limit(200);

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getAuditLogs;
