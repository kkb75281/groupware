type DebouncedFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

export function debounce<T extends (...args: any[]) => any>(callback: T, delay: number): DebouncedFunction<T> {
  let timeoutId: number | undefined;

  return function (this: any, ...args: Parameters<T>): void {
    // 이전 타이머가 있다면 제거
    if (timeoutId) window.clearTimeout(timeoutId);

    // 새로운 타이머 설정
    timeoutId = window.setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}
