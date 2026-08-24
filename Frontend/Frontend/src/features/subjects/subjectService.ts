import api from '@/lib/axios';
import type { Subject } from '@/types';

export const subjectService = {
  async getAll(search?: string): Promise<Subject[]> {
    const params = search ? { search } : {};
    const res = await api.get<{ success: boolean; data: Subject[] }>('/subjects', { params });
    return res.data.data;
  },

  async getBySlug(slug: string): Promise<Subject> {
    const res = await api.get<{ success: boolean; data: Subject }>(`/subjects/${slug}`);
    return res.data.data;
  },
};
