
import { NoiseRecord } from '../types';

const STORAGE_KEY = 'dsms_noise_data';

export const storageService = {
  saveNoiseRecord: (record: Omit<NoiseRecord, 'id' | 'timestamp'>): NoiseRecord => {
    const records = storageService.getNoiseRecords();
    const newRecord: NoiseRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    records.push(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  },

  getNoiseRecords: (): NoiseRecord[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  clearData: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
