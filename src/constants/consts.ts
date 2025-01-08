// 출퇴근 기록 관련
export interface IWorkFormat {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  startTimeStamp: number | null;
  endTimeStamp: number | null;
  dailyCommuteTime: number | null;
}

// 초기화
export const initWorkFormat: IWorkFormat = {
  date: null,
  startTime: null,
  endTime: null,
  startTimeStamp: null,
  endTimeStamp: null,
  dailyCommuteTime: null,
};
