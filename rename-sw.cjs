const fs = require('fs');
const path = require('path');

// 원본 파일 경로와 새 파일 경로 설정
const sourceFile = path.resolve(__dirname, '../public/sw.js'); // 원본 sw.js 파일
const targetFileName = process.env.VITE_SW_FILE_NAME;
const targetFile = path.resolve(__dirname, '../public', targetFileName);

// 파일 이름 변경 함수
function renameFile() {
  // 원본 파일 존재 여부 확인
  if (!fs.existsSync(sourceFile)) {
    console.error('원본 파일(sw.js)이 존재하지 않습니다.');
    return;
  }

  // 파일 이름 변경
  fs.rename(sourceFile, targetFile, (err) => {
    if (err) {
      console.error(`파일 이름 변경 실패: ${err.message}`);
      return;
    }
    console.log(`파일 이름이 ${targetFileName}으로 변경되었습니다.`);
  });
}

// 스크립트 실행
renameFile();