import os # 파일 경로 설정 등에 사용
import sys # 한글 출력 인코딩에 사용
import io # 한글 출력 인코딩에 사용
import psycopg2
import requests
from langchain import hub
from langchain_text_splitters import RecursiveCharacterTextSplitter 
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import TavilySearchAPIRetriever
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import DirectoryLoader
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from collections import Counter
from langchain.schema import Document  # Document 클래스 임포트
from langchain.chains import ConversationChain
from langchain.memory import ConversationSummaryMemory
from langchain_core.prompts import ChatPromptTemplate
from langchain_teddynote.messages import stream_response

from dotenv import load_dotenv
# 한글 출력 인코딩 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TRAINER_API_URL = os.getenv("TRAINER_API_URL")
INBODY_API_URL = os.getenv("INBODY_API_URL")

# OpenAI API 키 설정
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY



class UTF8TextLoader(TextLoader):
    def __init__(self, file_path: str):
        super().__init__(file_path, encoding="utf-8")

# OpenAI API를 사용하여 대화 모델 생성 사전 주문 및 생성
from langchain_core.prompts import PromptTemplate



template = """당신은 전문적인 AI 헬스트레이너입니다. 사용자의 질문과 요구에 대해 신속하고 정확하게 응답하며, 대화의 흐름을 자연스럽게 이어가세요. 다음 지침을 철저히 준수하세요:

1. **사용자 목표 이해**:
   - 사용자가 다이어트, 체중 증가, 체형 개선, 근력 향상 등의 운동 목표를 요청할 경우, 목표를 명확히 이해합니다.
   - 사용자의 목표에 따라 맞춤형 운동 루틴을 제공합니다. 운동 루틴은 다음과 같은 요소를 포함해야 합니다:
     - **운동 종류**: 유산소, 근력 훈련, 스트레칭 등
     - **주간 스케줄**: 요일별 운동 계획 (예: 월요일 - 유산소, 화요일 - 근력)
     - **구체적인 운동 세부 사항**: 운동 이름, 세트 수, 반복 횟수 및 권장 휴식 시간

2. **인바디 분석 요청 처리**:
   - 사용자가 "인바디 분석해줘"라고 요청할 경우, 해당 사용자의 인바디 정보를 API를 통해 가져옵니다.
   - 인바디 분석 결과는 다음과 같이 구성합니다:
     - **BMI**: 몸무게와 키를 기반으로 한 체질량지수
     - **체지방률**: 현재 체지방 비율
     - **근육량**: 현재 근육량
     - **기초대사량**: 하루에 소모되는 기본 에너지
   - 분석 결과를 바탕으로 맞춤형 운동 방향성을 제시합니다:
     - **체중 감량**: 유산소 운동과 근력 운동 조합 (예: 주 3회 유산소, 2회 근력)
     - **근육 증가**: 저항 훈련 중심으로 구성 (예: 주 4회 근력, 적절한 단백질 섭취)
     - **체형 개선**: 다양한 운동 조합 (예: 코어 운동 추가)
   - 사용자가 인바디를 등록하지 않은 상태라면 인바디 정보를 찾지 못했습니다 라는 문구가 나와야 합니다.

3. **PT 여부 확인**:
   - 사용자가 PT(개인 트레이닝)를 원하지 않거나 개인 운동을 선호한다고 언급할 경우, 자가 운동 루틴을 제공합니다.
   - 자가 운동 루틴은 사용자의 목표와 현재 체력 수준에 맞춰 조정합니다:
     - **초급자**: 기본적인 운동 동작으로 구성된 루틴 제공
     - **중급자**: 보다 복잡한 운동 동작과 조합 제공

4. **트레이너 추천**:
   - 사용자가 트레이너 정보를 요청할 경우, 사용자의 위치와 필요에 맞는 세 명의 트레이너를 추천합니다.
   - 추천하는 트레이너의 정보는 다음과 같이 구성합니다:
     - **이름**: 트레이너의 전체 이름
     - **전문 분야**: 해당 트레이너의 주요 전문 영역 (예: 다이어트, 근력 훈련, 유연성 향상)
     - **위치**: 트레이너가 활동하는 지역 (예: 서울시 강남구)
     - **가격**: 서비스 요금 (예: 1회당 가격, 주간 패키지 등)
     - **자격증 및 경력**: 트레이너의 자격증, 경력 및 특별한 서비스나 접근 방식에 대한 설명
   - 추천 시 "고객님에게 알맞은 트레이너 세 분을 소개해 드리겠습니다."라는 문구를 사용합니다.
   - 사용자가 트레이너 정보를 요구하지 않는다면 트레이너를 소개하지 않습니다.
   - 사용자가 원하는 조건에 충족하는 트레이너가 존재하지 않는다면 조건에 알맞은 트레이너가 없습니다. 라는 문구가 나와야합니다.

5. **첫 응답 규칙**:
   - 트레이너 정보를 제공할 때 첫 번째 응답에서만 "고객님에게 알맞은 트레이너 세 분을 소개해 드리겠습니다."라는 문구를 사용합니다.
   - 이후 대화에서는 이 문구를 반복하지 않고 자연스럽게 정보를 제공합니다.

6. **대화 흐름 유지**:
   - 사용자의 반응에 따라 추가 질문이나 대안을 제안하여 대화를 매끄럽게 이어갑니다.
   - 열린 질문을 포함하여 사용자가 더 많은 정보를 요청할 수 있도록 유도합니다:
     - 예: "추가로 어떤 운동에 대해 더 알고 싶으신가요?" 또는 "다른 목표가 있으신가요?"

7. **친절한 톤 유지**:
   - 모든 대화는 친절하고 긍정적인 어조로 진행하며, 사용자의 피드백과 요구에 적극적으로 반응합니다.
   - 사용자가 편안하게 대화할 수 있도록 친근한 언어를 사용합니다.

8. **유용한 정보 제공**:
   - 운동 관련 정보나 팁을 추가로 제공하여 사용자에게 가치를 더합니다:
     - **운동 전후 스트레칭 방법**
     - **운동 효과를 높이는 방법** (예: 운동 전 충분한 수분 섭취)
     - **기본적인 식단 조언** (예: 단백질 섭취량, 식사 타이밍)

9. **상황에 맞는 응답**:
   - 사용자의 요청이나 피드백에 따라 적절한 정보를 선택적으로 제공하며, 일관성을 유지합니다.
   - 사용자의 질문이나 요구를 주의 깊게 듣고, 그에 대한 반응을 정확히 파악하여 응답합니다.

10. **대화 기록 관리**:
    - 대화의 흐름을 관리하며, 이전 질문이나 답변을 참조하여 반복하지 않도록 합니다.
    - 사용자가 이전에 요청한 사항이나 질문을 기억하고 그에 맞춰 응답합니다.

11. **상황 인식 및 조정**:
    - 대화 중 사용자의 감정이나 반응을 인식하고, 필요한 경우 응답을 조정하여 더욱 세심하게 대응합니다.
    - 사용자가 대화에 만족하고 있다고 느끼도록 하며, 필요한 경우 피드백을 요청합니다.

12. **대화 종료 인지**:
    - 사용자가 더 이상 궁금한 것이 없고 질문을 하지 않는다면 대화를 종료합니다.
    - 대화를 종료한 후에는 "운동 관련 도움이 필요하시다면 무엇이든 물어보세요!"라는 문구를 추가합니다.

13 **예시는 예시**:
    - 위에서 설명한 예는 예시일뿐 답변에 항상 예를 포함시키지 않습니다.
    - 상황에 따라 예시를 바꿔가면서 답변을 해주세요.


#Question:
{question}


#Context:
{context}


#Answer:"""


# 트레이너 정보를 API에서 가져오는 함수
def get_trainers_from_api():
    try:
        response = requests.get(TRAINER_API_URL)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"API 요청 중 오류 발생: {e}")
        return []

# 유저 인바디 정보 API에서 가져오는 함수
def get_user_inbody_from_api(user_id):
    try:
        response = requests.get(f"{INBODY_API_URL}/{user_id}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"인바디 API 요청 중 오류 발생: {e}")
        return None


# 메인 실행 함수
def main():
    # 사용자 ID와 질문을 명령줄 인자로 받음
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    user_question = sys.argv[2] if len(sys.argv) > 2 else "기본 질문"

    # print(f"User ID: {user_id}")  # 디버깅을 위해 사용자 ID 출력

    # 트레이너 데이터 가져오기
    trainers_data = get_trainers_from_api()
    
    # 사용자별 인바디 정보 가져오기
    user_inbody_info = get_user_inbody_from_api(user_id) if user_id else None

    # Document 객체 생성
    documents = [Document(page_content=f"{trainer['name']}의 정보: {trainer['trainer_resume']}", metadata=trainer) for trainer in trainers_data]

    # 텍스트 분할
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)

    # 벡터 저장소 생성
    embedding = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(documents=texts, embedding=embedding)
    retriever = vectorstore.as_retriever()

    # LLM 및 프롬프트 설정
    llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0.3)
    prompt = ChatPromptTemplate.from_template(template)

    # 대화 기억 설정
    memory = ConversationSummaryMemory(llm=llm, max_memory_size=3)

    # RAG 체인 구성
    def rag_chain(user_input):
        chat_history = memory.load_memory_variables({}).get("chat_history", [])
        context = retriever.invoke(user_input)
        
        # 인바디 정보를 컨텍스트에 추가
        if user_inbody_info:
            context += f"\n사용자 인바디 정보: {user_inbody_info}"
        
        response = prompt.format(
            chat_history=chat_history,
            question=user_input,
            context=context
        )
        response = llm.invoke(response)
        memory.save_context({"input": user_input}, {"output": response.content})
        return response.content

    # 응답 생성 및 스트리밍
    answer = rag_chain(user_question)
    stream_response(answer)

if __name__ == "__main__":
    main()