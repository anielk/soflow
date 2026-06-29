import type { Employee, Shift } from '@/types/employee';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-jake', name: 'Jake Davis', email: 'jake@agency.com',
    role: 'chatter', status: 'active',
    creatorsManaged: ['emma-rose', 'zoe-martinez'],
    messagesThisMonth: 1240, revenueGenerated: 3200, avgResponseMin: 4,
    joinedAt: '2025-10-01T00:00:00Z', lastActiveAt: '2026-06-28T12:30:00Z',
  },
  {
    id: 'emp-sarah', name: 'Sarah Wilson', email: 'sarah@agency.com',
    role: 'manager', status: 'active',
    creatorsManaged: ['emma-rose', 'mia-johnson'],
    messagesThisMonth: 840, revenueGenerated: 2100, avgResponseMin: 7,
    joinedAt: '2025-09-01T00:00:00Z', lastActiveAt: '2026-06-28T11:00:00Z',
  },
  {
    id: 'emp-mike', name: 'Mike Torres', email: 'mike@agency.com',
    role: 'chatter', status: 'active',
    creatorsManaged: ['sophia-lee'],
    messagesThisMonth: 960, revenueGenerated: 2640, avgResponseMin: 5,
    joinedAt: '2025-12-01T00:00:00Z', lastActiveAt: '2026-06-28T09:45:00Z',
  },
  {
    id: 'emp-alex', name: 'Alex Kim', email: 'alex@agency.com',
    role: 'chatter', status: 'active',
    creatorsManaged: [],
    messagesThisMonth: 280, revenueGenerated: 720, avgResponseMin: 6,
    joinedAt: '2026-04-15T00:00:00Z', lastActiveAt: '2026-06-27T22:00:00Z',
  },
  {
    id: 'emp-lisa', name: 'Lisa Chen', email: 'lisa@agency.com',
    role: 'manager', status: 'inactive',
    creatorsManaged: [],
    messagesThisMonth: 0, revenueGenerated: 0, avgResponseMin: 0,
    joinedAt: '2026-01-10T00:00:00Z',
  },
];

export const MOCK_SHIFTS: Shift[] = [
  { id: 's1', employeeId: 'emp-jake',  employeeName: 'Jake Davis',   startAt: '2026-06-28T08:00:00Z', endAt: '2026-06-28T16:00:00Z', status: 'completed',   creatorsAssigned: ['emma-rose'] },
  { id: 's2', employeeId: 'emp-sarah', employeeName: 'Sarah Wilson', startAt: '2026-06-28T14:00:00Z', endAt: '2026-06-28T22:00:00Z', status: 'in_progress', creatorsAssigned: ['mia-johnson'] },
  { id: 's3', employeeId: 'emp-mike',  employeeName: 'Mike Torres',  startAt: '2026-06-28T18:00:00Z', endAt: '2026-06-29T02:00:00Z', status: 'upcoming',    creatorsAssigned: ['sophia-lee'] },
  { id: 's4', employeeId: 'emp-jake',  employeeName: 'Jake Davis',   startAt: '2026-06-29T08:00:00Z', endAt: '2026-06-29T16:00:00Z', status: 'upcoming',    creatorsAssigned: ['emma-rose', 'zoe-martinez'] },
  { id: 's5', employeeId: 'emp-alex',  employeeName: 'Alex Kim',     startAt: '2026-06-29T12:00:00Z', endAt: '2026-06-29T20:00:00Z', status: 'upcoming',    creatorsAssigned: [] },
  { id: 's6', employeeId: 'emp-sarah', employeeName: 'Sarah Wilson', startAt: '2026-06-29T14:00:00Z', endAt: '2026-06-29T22:00:00Z', status: 'upcoming',    creatorsAssigned: ['emma-rose', 'mia-johnson'] },
  { id: 's7', employeeId: 'emp-mike',  employeeName: 'Mike Torres',  startAt: '2026-06-30T09:00:00Z', endAt: '2026-06-30T17:00:00Z', status: 'upcoming',    creatorsAssigned: ['sophia-lee'] },
  { id: 's8', employeeId: 'emp-jake',  employeeName: 'Jake Davis',   startAt: '2026-06-30T16:00:00Z', endAt: '2026-07-01T00:00:00Z', status: 'upcoming',    creatorsAssigned: ['emma-rose'] },
];

export function getEmployee(id: string): Employee | undefined {
  return MOCK_EMPLOYEES.find((e) => e.id === id);
}
