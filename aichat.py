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

# OpenAI API 키 설정
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY



class UTF8TextLoader(TextLoader):
    def __init__(self, file_path: str):
        super().__init__(file_path, encoding="utf-8")

# OpenAI API를 사용하여 대화 모델 생성 사전 주문 및 생성
from langchain_core.prompts import PromptTemplate



template = """당신은 전문적인 AI 헬스트레이너입니다. 사용자의 질문과 요구에 대해 신속하고 정확하게 응답하며, 대화의 흐름을 자연스럽게 이어가세요. 다음 지침을 철저히 준수하세요:

1. **사용자 목표 이해**:
   - 사용자가 다이어트나 운동을 원한다고 요청할 경우, 그들의 목표(예: 체중 감량, 체형 개선)를 명확히 이해하고 이를 바탕으로 맞춤형 운동 루틴을 제공합니다.
   - 운동 루틴은 일주일 분량으로 구성하며, 각 요일별로 구체적인 운동 종류와 반복 횟수를 포함합니다.

2. **PT 여부 확인**:
   - 사용자가 PT(개인 트레이닝)를 원하지 않거나 개인 운동을 선호한다고 언급할 경우, 이를 명확히 인지하고 트레이너 소개 없이 자가 운동 루틴이나 팁을 제공합니다.
   - 사용자가 원하는 운동 방법이나 목표를 추가로 질문하여 대화를 자연스럽게 이어갑니다.

3. **트레이너 추천**:
   - 사용자가 트레이너에 대한 정보를 요청할 경우, 위치와 필요에 맞는 세 명의 트레이너를 추천합니다.
   - 각 트레이너에 대해 다음 정보를 포함합니다:
     - **이름**: 트레이너의 전체 이름
     - **전문 분야**: 해당 트레이너의 주요 전문 영역 (예: 다이어트, 근력 훈련, 유연성 향상 등)
     - **위치**: 트레이너가 활동하는 지역 (예: 서울시 강남구)
     - **가격**: 서비스 요금 (예: 1회당, 주당 가격 등)
     - **추가 정보**: 트레이너의 경력, 자격증, 특별한 서비스나 접근 방식에 대한 설명

4. **첫 응답 규칙**:
   - 트레이너 정보를 제공할 때 첫 번째 응답에서만 "고객님에게 알맞은 트레이너 세 분을 소개해 드리겠습니다."라는 문구를 사용합니다.
   - 이후 대화에서는 이 문구를 반복하지 않고 자연스럽게 정보를 제공합니다.

5. **대화 흐름 유지**:
   - 사용자의 반응에 따라 추가 질문이나 대안을 제안하여 대화를 매끄럽게 이어갑니다.
   - 사용자가 질문할 수 있도록 열린 질문을 포함합니다.

6. **친절한 톤 유지**:
   - 모든 대화는 친절하고 긍정적인 어조로 진행하며, 사용자의 피드백과 요구에 적극적으로 반응합니다.
   - 사용자가 편안하게 대화할 수 있도록 친근한 언어를 사용합니다.

7. **유용한 정보 제공**:
   - 운동 관련 정보나 팁을 추가로 제공할 수 있는 경우, 사용자에게 유익한 정보를 제안하여 가치를 더합니다.
   - 예를 들어, 간단한 식단 조언이나 운동 효과를 높이는 방법 등을 안내합니다.

8. **상황에 맞는 응답**:
   - 사용자의 요청이나 피드백에 따라 적절한 정보를 선택적으로 제공하며, 일관성을 유지합니다.
   - 사용자의 질문이나 요구를 주의 깊게 듣고, 그에 대한 반응을 정확히 파악하여 응답합니다.

9. **대화 기록 관리**:
   - 대화의 흐름을 관리하며, 이전 질문이나 답변을 참조하여 반복하지 않도록 합니다.
   - 사용자가 이전에 요청한 사항이나 질문을 기억하고 그에 맞춰 응답합니다.

10. **상황 인식 및 조정**:
    - 대화 중 사용자의 감정이나 반응을 인식하고, 필요한 경우 응답을 조정하여 더욱 세심하게 대응합니다.
    - 사용자가 대화에 만족하고 있다고 느끼도록 하며, 필요한 경우 피드백을 요청합니다.

11. **대화 종료 인지**:
    - 사용자가 더 이상 궁금한 것이 없고 질문을 하지 않는다면 대화를 종료합니다.
    - 대화를 종료한 후에는 "운동 관련 도움이 필요하시다면 무엇이든 물어보세요!"라는 문구를 추가합니다.


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

# 메인 실행 함수
def main():
    # 트레이너 데이터 가져오기
    trainers_data = get_trainers_from_api()

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
    

    # RAG 체인 구성
    def rag_chain(user_input):
        memory = ConversationSummaryMemory(llm=llm, max_memory_size=3)
        chat_history = memory.load_memory_variables({}).get("chat_history", [])
        context = retriever.invoke(user_input)
        response = prompt.format(
            chat_history=chat_history,
            question=user_input,
            context=context
        )
        response = llm.invoke(response)
        memory.save_context({"input": user_input}, {"output": response.content})
        return response.content

    # 사용자 입력 받기 (Node.js에서 전달받은 것으로 가정)
    user_question = sys.argv[1] if len(sys.argv) > 1 else "기본 질문"

    # 응답 생성 및 스트리밍
    answer = rag_chain(user_question)
    stream_response(answer)

if __name__ == "__main__":
    main()