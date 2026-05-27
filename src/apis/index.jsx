const backendDomain = 'http://localhost:3000';

const SummaryApi = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  signUp:  { url: `${backendDomain}/api/users/signup`,  method: 'post' },
  signIn:  { url: `${backendDomain}/api/users/login`,   method: 'post' },
  logout:  { url: `${backendDomain}/api/users/logout`,  method: 'post' },

  // ── Users ─────────────────────────────────────────────────────────────────
  getAllUsers:           { url: `${backendDomain}/api/users`,                  method: 'get' },
  getUserById:          { url: `${backendDomain}/api/users/id`,               method: 'get' },
  getUserByEmployeeId:  { url: `${backendDomain}/api/users/employee`,         method: 'get' },
  getUsersByDepartment: { url: `${backendDomain}/api/users/department`,       method: 'get' },
  getUsersByRole:       { url: `${backendDomain}/api/users/role`,             method: 'get' },
  getUsersByManager:    { url: `${backendDomain}/api/users/manager`,          method: 'get' },

  // ── Projects ──────────────────────────────────────────────────────────────
  getProjects:    { url: `${backendDomain}/api/projects`, method: 'get'    },
  createProject:  { url: `${backendDomain}/api/projects`, method: 'post'   },
  getProjectById: { url: `${backendDomain}/api/projects`, method: 'get'    }, // append /:id
  updateProject:  { url: `${backendDomain}/api/projects`, method: 'put'    }, // append /:id
  deleteProject:  { url: `${backendDomain}/api/projects`, method: 'delete' }, // append /:id

  // ── Departmental Hours ────────────────────────────────────────────────────
  getDeptHours:    { url: `${backendDomain}/api/dept-hours`, method: 'get'  }, // append /:projectId
  upsertDeptHours: { url: `${backendDomain}/api/dept-hours`, method: 'post' },

  // ── Allocations ───────────────────────────────────────────────────────────
  getAllocations:    { url: `${backendDomain}/api/allocations`, method: 'get'    }, // append /:projectId
  allocateEmployee: { url: `${backendDomain}/api/allocations`, method: 'post'   },
  removeAllocation: { url: `${backendDomain}/api/allocations`, method: 'delete' }, // append /:id

  // ── Weekly Plans ──────────────────────────────────────────────────────────
  getWeeklyPlans:           { url: `${backendDomain}/api/weekly-plans`,                    method: 'get'  }, // append /:projectId
  upsertWeeklyPlan:         { url: `${backendDomain}/api/weekly-plans`,                    method: 'post' },
  getAllWeeklyPlans:         { url: `${backendDomain}/api/weekly-plans/all`,                method: 'get'  },
  bulkUpsertWeeklyPlan:     { url: `${backendDomain}/api/weekly-plans/bulk`,               method: 'post' },
  getEmployeeWeekCapacity:  { url: `${backendDomain}/api/weekly-plans/employee-capacity`,  method: 'get'  },

  // ── Weekly Cap (global per year+week) ─────────────────────────────────────
  getWeeklyCap: { url: `${backendDomain}/api/weekly-cap`, method: 'get' },

  // ── Weekly Project Config ─────────────────────────────────────────────────
  getWeeklyProjectConfig:    { url: `${backendDomain}/api/weekly-project-config`, method: 'get'  }, // append /:projectId
  upsertWeeklyProjectConfig: { url: `${backendDomain}/api/weekly-project-config`, method: 'post' },

  // ── Work Logs ─────────────────────────────────────────────────────────────
  getWorkLogs:            { url: `${backendDomain}/api/work-logs`,                   method: 'get'  }, // append /:projectId
  submitWorkLog:          { url: `${backendDomain}/api/work-logs`,                   method: 'post' },
  getEmployeeProjects:    { url: `${backendDomain}/api/work-logs/employee-projects`, method: 'get'  },
  managerUpdateWorkLog:   { url: `${backendDomain}/api/work-logs/manager-update`,    method: 'post' },

  // ── Team ──────────────────────────────────────────────────────────────────
  getTeamMembers: { url: `${backendDomain}/api/users/team`, method: 'get' },

  // ── Weekly Summary ────────────────────────────────────────────────────────
  getWeeklySummary: { url: `${backendDomain}/api/weekly-summary`, method: 'get' },

  // ── Reports ───────────────────────────────────────────────────────────────
  generateReport: { url: `${backendDomain}/api/reports/generate`, method: 'post' },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  getAuditLogs: { url: `${backendDomain}/api/audit-logs`, method: 'get' },

  // ── Project Progress ──────────────────────────────────────────────────────
  getProjectProgress:    { url: `${backendDomain}/api/project-progress`, method: 'get'  }, // append /:projectId
  upsertProjectProgress: { url: `${backendDomain}/api/project-progress`, method: 'post' },
};

export default SummaryApi;
