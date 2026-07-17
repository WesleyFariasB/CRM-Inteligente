import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports a liveness payload with an ISO timestamp', () => {
    const result = new HealthService().getLiveness();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
