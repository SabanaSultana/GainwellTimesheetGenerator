const backendDomain = "http://localhost:3000";

const SummaryApi = {
  signUp: {
    url: `${backendDomain}/api/users/signup`,
    method: "post",
  },
  signIn: {
    url: `${backendDomain}/api/users/login`,
    method: "post",
  },
  logout: {
    url: `${backendDomain}/api/users/logout`,
    method: "post",
  },
  getAllUsers: {
    url: `${backendDomain}/api/users`,
    method: "get",
  },
  getUserById: {
    url: `${backendDomain}/api/users/id`,
    method: "get",
  },
  getUserByEmployeeId: {
    url: `${backendDomain}/api/users/employee`,
    method: "get",
  },
  getUsersByDepartment: {
    url: `${backendDomain}/api/users/department`,
    method: "get",
  },
  getUsersByRole: {
    url: `${backendDomain}/api/users/role`,
    method: "get",
  },
  getUsersByManager: {
    url: `${backendDomain}/api/users/manager`,
    method: "get",
  },
  getProjects: {
    url: `${backendDomain}/api/projects`,
    method: "get",
  },
  createProject: {
    url: `${backendDomain}/api/projects`,
    method: "post",
  },
};

export default SummaryApi;
