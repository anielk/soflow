export type EmployeeRole   = 'chatter' | 'manager' | 'admin';
export type EmployeeStatus = 'active' | 'inactive';
export type ShiftStatus    = 'upcoming' | 'in_progress' | 'completed' | 'missed';

export interface Employee {
  id:                 string;
  name:               string;
  email:              string;
  role:               EmployeeRole;
  status:             EmployeeStatus;
  creatorsManaged:    string[];  // creator IDs
  messagesThisMonth:  number;
  revenueGenerated:   number;
  avgResponseMin:     number;
  joinedAt:           string;
  lastActiveAt?:      string;
}

export interface Shift {
  id:               string;
  employeeId:       string;
  employeeName:     string;
  startAt:          string;
  endAt:            string;
  status:           ShiftStatus;
  creatorsAssigned: string[];
}
