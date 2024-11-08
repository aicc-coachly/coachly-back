# Node.js 베이스 이미지 사용
FROM node:18

# 작업 디렉토리 설정
WORKDIR /opt/app

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# 소스 파일 복사
COPY . .

# 환경 변수로 포트 설정 (기본값 8080)
ENV PORT=8080

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행
CMD ["npm", "start"]