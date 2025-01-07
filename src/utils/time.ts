import { reactive, ref, computed } from 'vue';

// 날짜 가져오기
const getDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// 시간 가져오기
const getTime = () => {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

// string -> timestamp
const convertTimeToTimestamp = (timeStr: string) => {
  const today = new Date(); // 현재 날짜 가져오기
  const [hours, minutes, seconds] = timeStr.split('-').map(Number); // 시간 문자열 파싱
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds); // 시간을 포함한 날짜 객체 생성 (현재 날짜에 입력받은 시간 설정)

  return date.getTime();
};

// string -> timestamp
const convertToTimestamp = (dateStr: string): number => {
  const date = new Date(dateStr.replace(' ', 'T'));
  return date.getTime();
};

// 시간이 범위 내에 있는지 확인
// string(15:00:00)를 받아야함.
const isTimeInRange = (targetTime: string, minTime: string, maxTime: string) => {
  const targetTimestamp = convertTimeToTimestamp(targetTime);
  const minTimestamp = convertTimeToTimestamp(minTime);
  const maxTimestamp = convertTimeToTimestamp(maxTime);

  return targetTimestamp >= minTimestamp && targetTimestamp <= maxTimestamp;
};

// 시간이 범위 내에 있는지 확인
// timestamp를 받아야함.
const isTimeInRangeTimestramp = (targetTimestamp: number, minTimestamp: number, maxTimestamp: number) => {
  return targetTimestamp >= minTimestamp && targetTimestamp <= maxTimestamp;
};

// timestamp에 시간을 더하는 함수
const addTimeToTimestamp = (timestamp: number, { hours = 0, minutes = 0, seconds = 0 }) => {
  const secondsToAdd = (hours * 3600 + minutes * 60 + seconds) * 1000;

  return timestamp + secondsToAdd; // 밀리초 단위로 변환
};

// 시간만 추출하는 함수
const extractTimeFromDateTime = (dateTimeStr: string): string => {
  if (!dateTimeStr) return '';

  return dateTimeStr.match(/\d{2}:\d{2}:\d{2}$/)[0]; // 시간만 추출 (ex. 2021-08-01 15:00:00 -> 15:00:00)
};

// X시간 Y분으로 변환
const convertMsToTime = (milliseconds: number): string => {
  // 밀리초를 시간과 분으로 변환
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  // 시간과 분을 문자열로 변환
  return `${hours}시간 ${minutes}분`;
};

export {
  getDate,
  getTime,
  convertToTimestamp,
  convertTimeToTimestamp,
  isTimeInRange,
  isTimeInRangeTimestramp,
  addTimeToTimestamp,
  extractTimeFromDateTime,
  convertMsToTime,
};
