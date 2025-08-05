import axios from 'axios';
import { Manhwa, SearchResult } from '../types/manhwa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ManhwaService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async getAllManhwa(skip: number = 0, limit: number = 20): Promise<Manhwa[]> {
    const response = await this.api.get(`/manhwa/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async getManhwaById(id: string): Promise<Manhwa> {
    const response = await this.api.get(`/manhwa/${id}`);
    return response.data;
  }

  async searchManhwa(query: string, limit: number = 10): Promise<SearchResult[]> {
    const response = await this.api.get(`/search/?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  }

  async findSimilar(manhwaId: string, limit: number = 5): Promise<SearchResult[]> {
    const response = await this.api.get(`/search/similar/${manhwaId}?limit=${limit}`);
    return response.data;
  }

  async generateSummary(manhwaId: string): Promise<{ summary: string }> {
    const response = await this.api.post(`/llm/summarize?manhwa_id=${manhwaId}`);
    return response.data;
  }
}

export const manhwaService = new ManhwaService();