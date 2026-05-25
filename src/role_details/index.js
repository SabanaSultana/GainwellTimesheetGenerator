// managers and their employees mapping

export const managerEmployees = {
  GEPL8538: [
    "GEPL0016",
    "GEPL0091",
    "GEPL7780",
    "GEPL0026",
    "GEPL7975",
    "GEPL0055",
    "GEPL8736",
    "GEPL0049",
    "GEPL0104",
    "GEPL0010"
  ],

  GEPL8355: [
    "GEPL0107",
    "GEPL4141",
    "GEPL0048",
    "GEPL0103",
    "GEPL0036",
    "GEPL7863"
  ],

  GEPL7012: [
    "GEPL7988",
    "GEPL0025",
    "GEPL7781",
    "GEPL0020",
    "GEPL7770",
    "GEPL0023",
    "GEPL0017",
    "GEPL7979",
    "GEPL8955"
  ],
  GEPL1000:[
    "GEPL7012",
    "GEPL8355",
    "GEPL8538"
  ]
};


// roles mapping

export const roles = {
  // Managers
  GEPL8538: "Manager(COE)",
  GEPL8355: "Manager(COE)",
  GEPL7012: "Manager(COE)",
  GEPL1000: "Head of Engineering",

  // Employees
  GEPL0016: "Employee",
  GEPL7988: "Employee",
  GEPL0025: "Employee",
  GEPL7781: "Employee",
  GEPL0020: "Employee",
  GEPL0091: "Employee",
  GEPL7780: "Employee",
  GEPL0107: "Employee",
  GEPL4141: "Employee",
  GEPL0048: "Employee",
  GEPL0103: "Employee",
  GEPL0036: "Employee",
  GEPL0026: "Employee",
  GEPL7770: "Employee",
  GEPL7975: "Employee",
  GEPL0055: "Employee",
  GEPL0023: "Employee",
  GEPL0017: "Employee",
  GEPL8736: "Employee",
  GEPL7979: "Employee",
  GEPL8955: "Employee",
  GEPL4174: "Employee",
  GEPL0049: "Employee",
  GEPL7863: "Employee",
  GEPL0104: "Employee",
  GEPL0010: "Employee"
};

export const departmentByEmployeeId = {
  GEPL8538: "Mechanical and System Integration",
  GEPL8355: "Smart Manufacturing",
  GEPL7012: "Electrical and Automation",
  GEPL1000: "Engineering & System"
};

export const roleOptions = [
  "Employee",
  "Manager(COE)",
  "Head of Engineering",
  "Admin"
];

export const departmentOptions = [
  "Mechanical and System Integration",
  "Virtual Manufacturing",
  "Smart Manufacturing",
  "Electrical and Automation",
  "Hydraulic",
  "Engineering & System",
  "Head of Engineering",
];

export const managerOptions = [
  { employeeId: "GEPL8538", name: "GEPL8538" },
  { employeeId: "GEPL8355", name: "GEPL8355" },
  { employeeId: "GEPL7012", name: "GEPL7012" }
];

export const headEngineeringOptions = [
  { employeeId: "GEPL1000", name: "GEPL1000" }
];


// find manager by employee ID

export const findManagerByEmployee = (employeeId) => {
  for (let managerId in managerEmployees) {
    if (managerEmployees[managerId].includes(employeeId)) {
      console.log(`Manager for employee ${employeeId} is ${managerId}`);
      return managerId;
    }
  }
  return null;
};


// find role by employee ID

export const findRoleByEmployeeId = (employeeId) => {
  return roles[employeeId] || null;
};