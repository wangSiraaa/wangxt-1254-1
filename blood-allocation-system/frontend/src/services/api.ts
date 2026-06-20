import { api } from './request';
import type {
  BloodBag,
  PageResult,
  Appointment,
  Handover,
  TemperatureRecord,
  ReturnedBlood,
} from '../types';

export const bloodBagApi = {
  create: (data: any) => api.post<BloodBag>('/blood-bags', data),
  list: (params?: any) =>
    api.get<PageResult<BloodBag>>('/blood-bags', { params }),
  get: (id: string) => api.get<BloodBag>(`/blood-bags/${id}`),
  getByCode: (bagCode: string) =>
    api.get<BloodBag>(`/blood-bags/code/${bagCode}`),
  update: (id: string, data: any) =>
    api.put<BloodBag>(`/blood-bags/${id}`, data),
  remove: (id: string) => api.delete(`/blood-bags/${id}`),
  stats: () => api.get('/blood-bags/stats'),
  expiring: () => api.get<BloodBag[]>('/blood-bags/expiring'),
  confirmCrossMatch: (data: any) =>
    api.post<BloodBag[]>('/blood-bags/cross-match/confirm', data),
  allocate: (data: any) =>
    api.post<BloodBag[]>('/blood-bags/allocate', data),
  checkExpired: () => api.post('/blood-bags/check-expired'),
};

export const appointmentApi = {
  create: (data: any) => api.post<Appointment>('/appointments', data),
  list: (params?: any) =>
    api.get<PageResult<Appointment>>('/appointments', { params }),
  get: (id: string) => api.get<Appointment>(`/appointments/${id}`),
  getByNo: (appointmentNo: string) =>
    api.get<Appointment>(`/appointments/no/${appointmentNo}`),
  update: (id: string, data: any) =>
    api.put<Appointment>(`/appointments/${id}`, data),
  approve: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/approve`, data),
  reject: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/reject`, data),
  allocate: (id: string) =>
    api.post<Appointment>(`/appointments/${id}/allocate`),
  confirmCrossMatch: (id: string) =>
    api.post<Appointment>(`/appointments/${id}/cross-match/confirm`),
  failCrossMatch: (id: string, reason: string) =>
    api.post<Appointment>(`/appointments/${id}/cross-match/fail`, { reason }),
  markReady: (id: string) =>
    api.post<Appointment>(`/appointments/${id}/ready-for-delivery`),
  cancel: (id: string, data?: any) =>
    api.post<Appointment>(`/appointments/${id}/cancel`, data),
  complete: (id: string) =>
    api.post<Appointment>(`/appointments/${id}/complete`),
};

export const handoverApi = {
  create: (data: any) => api.post<Handover>('/handovers', data),
  list: (params?: any) =>
    api.get<PageResult<Handover>>('/handovers', { params }),
  get: (id: string) => api.get<Handover>(`/handovers/${id}`),
  getByNo: (handoverNo: string) =>
    api.get<Handover>(`/handovers/no/${handoverNo}`),
  scanBag: (id: string, data: any) =>
    api.post(`/handovers/${id}/scan`, data),
  dispatch: (id: string, data: any) =>
    api.post<Handover>(`/handovers/${id}/dispatch`, data),
  receive: (id: string, data: any) =>
    api.post<Handover>(`/handovers/${id}/receive`, data),
  reject: (id: string, data: any) =>
    api.post<Handover>(`/handovers/${id}/reject`, data),
  batchReceive: (id: string, data: any) =>
    api.post<Handover>(`/handovers/${id}/batch-receive`, data),
};

export const temperatureApi = {
  check: (data: any) => api.post('/temperatures/check', data),
  record: (data: any) =>
    api.post<TemperatureRecord>('/temperatures', data),
  batchRecord: (data: any[]) =>
    api.post<TemperatureRecord[]>('/temperatures/batch', data),
  list: (params?: any) =>
    api.get<PageResult<TemperatureRecord>>('/temperatures', { params }),
  getByHandover: (handoverId: string) =>
    api.get<TemperatureRecord[]>(`/temperatures/handover/${handoverId}`),
  getByBloodBag: (bloodBagId: string) =>
    api.get<TemperatureRecord[]>(`/temperatures/blood-bag/${bloodBagId}`),
  getSummary: (handoverId: string) =>
    api.get(`/temperatures/handover/${handoverId}/summary`),
  alerts: (startTime?: string, endTime?: string) =>
    api.get<TemperatureRecord[]>('/temperatures/alerts', {
      params: { startTime, endTime },
    }),
};

export const returnedApi = {
  create: (data: any) => api.post<ReturnedBlood>('/returned-bloods', data),
  list: (params?: any) =>
    api.get<PageResult<ReturnedBlood>>('/returned-bloods', { params }),
  get: (id: string) => api.get<ReturnedBlood>(`/returned-bloods/${id}`),
  getByNo: (returnNo: string) =>
    api.get<ReturnedBlood>(`/returned-bloods/no/${returnNo}`),
  inspect: (id: string, data: any) =>
    api.post<ReturnedBlood>(`/returned-bloods/${id}/inspect`, data),
  reInventory: (id: string, operator: string) =>
    api.post<ReturnedBlood>(`/returned-bloods/${id}/re-inventory`, {
      operator,
    }),
  discard: (id: string, operator: string, reason?: string) =>
    api.post<ReturnedBlood>(`/returned-bloods/${id}/discard`, {
      operator,
      reason,
    }),
};
