import { classifyClientIp } from './ip-address.util';

describe('classifyClientIp', () => {
  it('classifies missing values as unknown', () => {
    expect(classifyClientIp(undefined)).toBe('unknown');
    expect(classifyClientIp(null)).toBe('unknown');
    expect(classifyClientIp('')).toBe('unknown');
    expect(classifyClientIp('   ')).toBe('unknown');
  });

  it('classifies garbage/unparseable input as unknown, not private or public', () => {
    expect(classifyClientIp('not-an-ip')).toBe('unknown');
    expect(classifyClientIp('999.999.999.999')).toBe('unknown');
  });

  it('classifies real public IPv4 addresses as public', () => {
    expect(classifyClientIp('83.1.2.3')).toBe('public');
    expect(classifyClientIp('52.4.5.6')).toBe('public');
    expect(classifyClientIp('8.8.8.8')).toBe('public');
  });

  it('classifies RFC1918 private ranges as private', () => {
    expect(classifyClientIp('10.0.0.5')).toBe('private');
    expect(classifyClientIp('192.168.1.10')).toBe('private');
  });

  it("classifies Docker's default bridge ranges (172.16.0.0/12) as private", () => {
    // creator-network's actual live range, confirmed via `docker network inspect`
    expect(classifyClientIp('172.18.0.5')).toBe('private');
    expect(classifyClientIp('172.17.0.2')).toBe('private');
    expect(classifyClientIp('172.31.255.255')).toBe('private');
  });

  it('classifies loopback and link-local IPv4 as private', () => {
    expect(classifyClientIp('127.0.0.1')).toBe('private');
    expect(classifyClientIp('169.254.1.1')).toBe('private');
  });

  it('classifies IPv6 loopback, link-local, and unique-local as private', () => {
    expect(classifyClientIp('::1')).toBe('private');
    expect(classifyClientIp('fe80::1')).toBe('private');
    expect(classifyClientIp('fc00::1')).toBe('private');
    expect(classifyClientIp('fd12:3456:789a::1')).toBe('private');
  });

  it('classifies a real public IPv6 address as public', () => {
    expect(classifyClientIp('2001:4860:4860::8888')).toBe('public');
  });

  it('unwraps IPv4-mapped IPv6 addresses before classifying', () => {
    expect(classifyClientIp('::ffff:172.18.0.5')).toBe('private');
    expect(classifyClientIp('::ffff:83.1.2.3')).toBe('public');
  });

  it("172.15.x.x and 172.32.x.x fall just outside Docker's private range and are public", () => {
    expect(classifyClientIp('172.15.0.1')).toBe('public');
    expect(classifyClientIp('172.32.0.1')).toBe('public');
  });
});
