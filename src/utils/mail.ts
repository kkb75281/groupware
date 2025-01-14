async function fetchGmailEmails(accessToken) {
    // console.log('=== fetchGmailEmails === accessToken:', accessToken);

    try {
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=UNREAD&maxResults=10', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // console.log('=== fetchGmailEmails === response:', response);

        const data = await response.json();
        const messages = data.messages || [];

        // 메일 상세 정보 모두 가져오기
        const detailedMails = await Promise.all(
            messages.map(message => fetchMessageDetails(accessToken, message.id, message.threadId))
        );
        // console.log('detailedMails : ', detailedMails);

        // 최신 메일이 위로 오도록 정렬
        detailedMails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 최신 5개 메일만 가져오기
        // mails.value = detailedMails.splice(0, 5);
        return detailedMails.splice(0, 5);
    } catch (error) {
        sessionStorage.clear();
        console.error('Error fetching Gmail emails:', error);
    }
}

async function fetchMessageDetails(accessToken, messageId, threadId) {
    try {
        const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        const headers = data.payload.headers;
        const subjectHeader = headers.find(header => header.name === 'Subject');
        const fromHeader = headers.find(header => header.name === 'From');
        const dateHeader = headers.find(header => header.name === 'Date');
        const rawDate = dateHeader ? dateHeader.value : null;
        const snippet = data.snippet;

        // 보낸 사람 추출
        const fromValue = fromHeader ? fromHeader.value : 'Unknown Sender';
        const senderName = extractSenderName(fromValue);

        return {
            id: messageId,
            subject: subjectHeader ? subjectHeader.value : 'No Subject',
            from: senderName,
            date: rawDate ? formatMailDate(rawDate) : 'Unknown Date',
            snippet: snippet,
            link: `https://mail.google.com/mail/u/0/#inbox/${threadId}`
        };
    } catch (error) {
        console.error('Error fetching message details:', error);
        return {
            id: messageId,
            subject: 'Error fetching subject',
            from: 'Error fetching sender',
            date: 'Error fetching date',
            snippet: 'Error fetching snippet',
            link: '#'
        };
    }
}

function extractSenderName(fromValue) {
    const nameRegex = /"([^"]+)"|([^<]+)</;
    const match = nameRegex.exec(fromValue);

    return match ? match[1] || match[2].trim() : fromValue;
}

// 메일 날짜 형식 변환 (ex. 2025/1/1)
function formatMailDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear() % 100; // 연도의 마지막 두 자리 (2025 -> 25)
    const month = date.getMonth() + 1;    // 월 (0부터 시작하므로 +1)
    const day = date.getDate();           // 일

    return `${year}/${month}/${day}`;
}

export { fetchGmailEmails, fetchMessageDetails, extractSenderName, formatMailDate };