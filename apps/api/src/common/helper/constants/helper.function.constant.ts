import ms from 'ms';

export function seconds(value: number): number {
  const msValue = ms(value);
  return +msValue / 1000;
}

export function cast<T>(value: unknown): T {
  return value as T;
}
