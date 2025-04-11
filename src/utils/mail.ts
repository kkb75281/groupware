import { refreshAccessToken } from '../main.ts';
import { user } from '../user.ts';

async function fetchGmailEmails(accessToken: any) {
  if (!accessToken) {
    console.error('액세스 토큰이 없어 이메일을 가져올 수 없습니다.');
    return [];
  }

  try {
    const response = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=UNREAD&maxResults=10',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    // 토큰 만료 또는 오류 처리
    if (!response.ok) {
      if (response.status === 401) {
        console.error('액세스 토큰이 만료되었습니다.');
        // 세션 스토리지 토큰 삭제

        await refreshAccessToken();
        return fetchGmailEmails(localStorage.getItem('accessToken'));
      }
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    // 메일 상세 정보 모두 가져오기
    const detailedMails = await Promise.all(
      messages.map((message: any) => fetchMessageDetails(accessToken, message.id, message.threadId))
    );
    // console.log('detailedMails : ', detailedMails);

    // 최신 메일이 위로 오도록 정렬
    detailedMails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 최신 5개 메일만 가져오기
    return detailedMails.splice(0, 10);
  } catch (error) {
    console.error('Error fetching Gmail emails:', error);
    return [];
  }
}

async function fetchMessageDetails(accessToken: any, messageId: any, threadId: any) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    // 토큰 만료 또는 오류 처리
    if (!response.ok) {
      if (response.status === 401) {
        console.error('액세스 토큰이 만료되었습니다.');
        // 세션 스토리지 토큰 삭제

        await refreshAccessToken();
        return fetchMessageDetails(localStorage.getItem('accessToken'), messageId, threadId);
      }
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    const headers = data.payload.headers;
    // console.log('=== fetchMessageDetails === headers : ', headers);
    const subjectHeader = headers.find((header: any) => header.name === 'Subject');
    const fromHeader = headers.find((header: any) => header.name === 'From');
    const dateHeader = headers.find((header: any) => header.name === 'Date');
    const rawDate = dateHeader ? dateHeader.value : null;
    const snippet = data.snippet;
    const hasAttachment = checkForAttachments(data.payload);

    // 보낸 사람 추출
    const fromValue = fromHeader ? fromHeader.value : 'Unknown Sender';
    const senderName = extractSenderName(fromValue);

    return {
      id: messageId,
      subject: subjectHeader ? subjectHeader.value : 'No Subject',
      from: senderName,
      date: rawDate ? formatMailDate(rawDate) : 'Unknown Date',
      snippet: snippet,
      link: `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
      hasAttachment: hasAttachment,
      dateTimeStamp: convertToTimestamp(rawDate),
      noti_id: messageId,
      send_date: convertToTimestamp(rawDate),
      audit_info: {
        audit_type: 'email'
      }
    };
  } catch (error) {
    console.error('Error fetching message details:', error);
    return {
      id: messageId,
      subject: 'Error fetching subject',
      from: 'Error fetching sender',
      date: 'Error fetching date',
      snippet: 'Error fetching snippet',
      hasAttachment: false,
      link: '#'
    };
  }
}

function extractSenderName(fromValue: any) {
  const nameRegex = /"([^"]+)"|([^<]+)</;
  const match = nameRegex.exec(fromValue);

  return match ? match[1] || match[2].trim() : fromValue;
}

// 메일 날짜 형식 변환 (ex. 2025/1/1)
function formatMailDate(dateString: any) {
  const date = new Date(dateString);
  const year = date.getFullYear() % 100; // 연도의 마지막 두 자리 (2025 -> 25)
  const month = date.getMonth() + 1; // 월 (0부터 시작하므로 +1)
  const day = date.getDate(); // 일

  return `${year}/${month}/${day}`;
}

// 첨부파일 확인
function checkForAttachments(payload: any) {
  // 첨부파일이 있는 경우 filename과 mimeType이 존재
  if (payload.parts) {
    return payload.parts.some((part: any) => part.filename && part.filename.length > 0);
  }
  return false;
}

// 날짜 문자열을 타임스탬프로 변환
function convertToTimestamp(dateTimeString: any) {
  // 날짜 객체 생성
  const date = new Date(dateTimeString);
  // 타임스탬프로 변환 (밀리초 단위)
  const timestamp = date.getTime();
  return timestamp;
}

function openGmailAppOrWeb(link: string | null, messageId?: string | null) {
	const googleAccountCheck = !!localStorage.getItem('accessToken'); // Google 계정 로그인 여부 확인
	const encodedEmail = googleAccountCheck ? encodeURIComponent(user.email) : '';
  
	// Gmail 앱 딥 링크 및 웹 URL 생성
	const getGmailUrls = (link: string | null, messageId?: string | null) => {
	  let gmailAppUrlIOS = '';
	  let gmailAppUrlAndroid = '';
	  let gmailWebUrl = '';
  
	  if (link) {
		if (messageId) {
		//   // 특정 메일 보기 (웹 버전으로 폴백)
		//   gmailWebUrl = googleAccountCheck
        //   ? `https://mail.google.com/mail/u/${encodedEmail}/#inbox/${encodeURIComponent(messageId)}?authuser=${encodedEmail}&login_hint=${encodedEmail}`
        //   : `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(messageId)}`;
			// 특정 메일 보기
			gmailAppUrlIOS = googleAccountCheck
			? `googlegmail://inbox/${encodeURIComponent(messageId)}?authuser=${encodedEmail}&login_hint=${encodedEmail}`
			: `googlegmail://inbox/${encodeURIComponent(messageId)}`;
			gmailAppUrlAndroid = googleAccountCheck
			? `intent://gmail/#Intent;scheme=android-app;package=com.google.android.gm;S.browser_fallback_url=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F${encodedEmail}%2F%23inbox%2F${encodeURIComponent(messageId)}%3Fauthuser%3D${encodedEmail}%26login_hint%3D${encodedEmail};end`
			: `intent://gmail/#Intent;scheme=android-app;package=com.google.android.gm;S.browser_fallback_url=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F%23inbox%2F${encodeURIComponent(messageId)};end`;
			gmailWebUrl = googleAccountCheck
			? `https://mail.google.com/mail/u/${encodedEmail}/#inbox/${encodeURIComponent(messageId)}?authuser=${encodedEmail}&login_hint=${encodedEmail}`
			: `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(messageId)}`;
		} else {
		  // 특정 이메일 주소로 메일 작성
		  gmailAppUrlIOS = `googlegmail://co?to=${encodeURIComponent(link)}`;
		  gmailAppUrlAndroid = `mailto:${link}`;
		  gmailWebUrl = googleAccountCheck
			? `https://mail.google.com/mail/u/${encodedEmail}/?view=cm&fs=1&to=${encodeURIComponent(link)}&authuser=${encodedEmail}&login_hint=${encodedEmail}`
			: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(link)}`;
		}
	  } else {
		// 기본 Gmail 앱 메일함 열기
		gmailAppUrlIOS = 'googlegmail://inbox';
		gmailAppUrlAndroid = `intent://gmail/#Intent;scheme=android-app;package=com.google.android.gm;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.google.android.gm;end`;
		gmailWebUrl = googleAccountCheck
		  ? `https://mail.google.com/mail/u/${encodedEmail}/?authuser=${encodedEmail}&login_hint=${encodedEmail}`
		  : 'https://mail.google.com/mail/u/0/#inbox';
	  }
  
	  return { gmailAppUrlIOS, gmailAppUrlAndroid, gmailWebUrl };
	};
  
	const { gmailAppUrlIOS, gmailAppUrlAndroid, gmailWebUrl } = getGmailUrls(link, messageId);
  
	console.log('googleAccountCheck:', googleAccountCheck);
	console.log('gmailWebUrl:', gmailWebUrl);
  
	try {
	  if (!messageId && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
		// iOS: Gmail 앱 딥 링크 호출
		window.location.href = gmailAppUrlIOS;
	  } else if (!messageId && /Android/i.test(navigator.userAgent)) {
		// Android: Gmail 앱 딥 링크 호출 및 웹 폴백
		const fallbackTimeout = 1000; // 1초 대기 시간
		let appOpened = false;
  
		window.location.href = gmailAppUrlAndroid;
  
		setTimeout(() => {
		  if (!appOpened) {
			console.log("Gmail app not opened, redirecting to web version...");
			window.open(gmailWebUrl, '_blank');
		  }
		}, fallbackTimeout);
  
		window.addEventListener('blur', () => {
		  appOpened = true;
		});
	  } else {
		// 기타 플랫폼 또는 특정 메일 보기 요청
		window.open(gmailWebUrl, '_blank');
	  }
	} catch (error) {
	  console.error('Failed to open Gmail app, redirecting to web version...', error);
	  window.open(gmailWebUrl, '_blank');
	}
}

export {
  fetchGmailEmails,
  fetchMessageDetails,
  extractSenderName,
  formatMailDate,
  checkForAttachments,
  openGmailAppOrWeb
};
