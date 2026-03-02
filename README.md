# Система анализа ЭКГ

## Обзор

Полноценная система анализа электрокардиограмм (ЭКГ) с использованием современных технологий машинного обучения. Проект состоит из backend части на FastAPI и frontend части на React с TypeScript.

## Особенности

- 🔐 JWT аутентификация с bcrypt хешированием паролей
- 📊 5-классовая классификация ЭКГ: NORM, MI, STTC, CD, HYP
- 🗄️ SQLite база данных с SQLAlchemy ORM
- 🤖 PyTorch модель (CNN + Transformer + Attention)
- 📈 Интерактивная визуализация ЭКГ сигналов
- 🛡️ Валидация данных и обработка ошибок
- 📝 Полная документация API через OpenAPI/Swagger
- 🎨 Современный React frontend с TypeScript

## Классы диагнозов

- **NORM** - Нормальный ритм сердца
- **MI** - Инфаркт миокарда
- **STTC** - Ишемические изменения (ST-T изменения)
- **CD** - Нарушения проводимости
- **HYP** - Гипертрофия камер сердца

## Требования

### Backend
- Python 3.10+
- PyTorch
- FastAPI
- SQLAlchemy
- python-jose
- bcrypt

### Frontend
- Node.js 18+
- npm или pnpm
- TypeScript

## Установка и запуск

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd ecg-analysis-system
```

### 2. Настройка Backend

#### Создание виртуального окружения
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows
```

#### Установка зависимостей
```bash
pip install -r requirements.txt
```

#### Настройка окружения
```bash
cp .env.example .env
```

Отредактируйте `.env` файл с вашими настройками:
```bash
# Приложение
APP_NAME="ECG Analysis API"
DEBUG=false

# JWT аутентификация
SECRET_KEY="ваш-секретный-ключ-для-продакшена"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# База данных
DATABASE_URL="sqlite:///./ecg_analysis.db"

# ML модель
MODEL_WEIGHTS_PATH="best_model_500hz.pth"
MODEL_NUM_CLASSES=5
MODEL_SEQ_LEN=5000
MODEL_N_LEADS=12
```

#### Запуск Backend
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Настройка Frontend

#### Установка зависимостей
```bash
cd ../frontend
npm install
# или
pnpm install
```

#### Настройка окружения
```bash
cp .env.example .env
```

#### Запуск Frontend
```bash
npm run dev
# или
pnpm dev
```

## API Эндпоинты

### Аутентификация

#### Регистрация пользователя
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "Имя Фамилия"
}
```

#### Вход пользователя
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### OAuth2 токен (совместимый)
```http
POST /api/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=user@example.com&password=securepassword
```

#### Текущий пользователь
```http
GET /api/users/me
Authorization: Bearer <jwt_token>
```

### Анализ ЭКГ

#### Анализ ЭКГ сигнала
```http
POST /api/ecg/analyze
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "data": [
    [1.2, 1.3, ...],  // Lead I
    [2.1, 2.2, ...],  // Lead II
    // ... 12 отведений по 5000 значений
  ]
}
```

**Ответ:**
```json
{
  "probabilities": {
    "NORM": 0.85,
    "MI": 0.05,
    "STTC": 0.03,
    "CD": 0.04,
    "HYP": 0.03
  },
  "predicted_class": "NORM"
}
```

### Health Check
```http
GET /health
```

## Структура проекта

```
ecg-analysis-system/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py      # Эндпоинты аутентификации
│   │   │   │   ├── ecg.py       # Эндпоинт анализа ЭКГ
│   │   │   │   └── users.py     # Эндпоинты пользователей
│   │   │   └── deps.py          # Зависимости FastAPI
│   │   ├── core/
│   │   │   ├── config.py        # Конфигурация приложения
│   │   │   └── security.py      # JWT и хеширование паролей
│   │   ├── db/
│   │   │   ├── base.py          # Базовый класс SQLAlchemy
│   │   │   └── models.py        # ORM модели
│   │   ├── models/
│   │   │   └── ecg_model.py     # PyTorch модель ЭКГ
│   │   ├── schemas/
│   │   │   ├── auth.py          # Pydantic схемы аутентификации
│   │   │   └── ecg.py           # Pydantic схемы ЭКГ
│   │   ├── services/
│   │   │   └── ml_service.py    # Сервис ML обработки
│   │   └── main.py              # Главный FastAPI приложение
│   ├── requirements.txt
│   ├── best_model_500hz.pth     # Веса PyTorch модели
│   └── README.md
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.ts          # API аутентификации
│   │   │   ├── ecg.ts           # API ЭКГ анализа
│   │   │   └── hooks.ts         # React hooks для API
│   │   ├── components/
│   │   │   ├── ECGChart.tsx     # Компонент визуализации ЭКГ
│   │   │   ├── ECGUpload.tsx    # Компонент загрузки ЭКГ
│   │   │   ├── AnalysisDashboard.tsx  # Панель анализа
│   │   │   └── layout/
│   │   │       └── AppShell.tsx # Главный layout
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Главная страница
│   │   │   └── LoginPage.tsx        # Страница входа
│   │   ├── store/
│   │   │   ├── authStore.ts     # Хранилище аутентификации
│   │   │   └── analysisStore.ts # Хранилище анализа
│   │   ├── types/
│   │   │   ├── api.ts           # Типы API
│   │   │   └── ecg.ts           # Типы ЭКГ данных
│   │   ├── utils/
│   │   │   └── ecgParser.ts     # Парсер ЭКГ данных
│   │   ├── lib/
│   │   │   ├── apiClient.ts     # HTTP клиент
│   │   │   └── queryClient.ts   # React Query клиент
│   │   ├── App.tsx              # Главный компонент
│   │   └── main.tsx             # Точка входа
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
├── .gitignore
└── README.md
```

## Модели данных

### Пользователь (User)
- `id`: int - Уникальный идентификатор
- `email`: str - Email (уникальный)
- `hashed_password`: str - Хеш пароля (bcrypt)
- `full_name`: str | null - Полное имя
- `is_active`: bool - Статус активности
- `created_at`: datetime - Дата создания

### ЭКГ Запись (ECGRecord)
- `id`: int - Уникальный идентификатор
- `patient_id`: int - Ссылка на пациента
- `recorded_at`: datetime - Дата записи
- `sampling_rate_hz`: int - Частота дискретизации
- `duration_sec`: float - Длительность в секундах
- `metadata_json`: text - Дополнительные метаданные

### Результат анализа (AnalysisResult)
- `id`: int - Уникальный идентификатор
- `ecg_record_id`: int - Ссылка на ЭКГ запись
- `predicted_class`: str - Предсказанный класс
- `prob_norm`: float - Вероятность нормального ритма
- `prob_mi`: float - Вероятность инфаркта миокарда
- `prob_sttc`: float - Вероятность ишемии
- `prob_cd`: float - Вероятность нарушения проводимости
- `prob_hyp`: float - Вероятность гипертрофии

## Использование

### 1. Регистрация и вход
1. Перейдите на страницу регистрации
2. Заполните форму регистрации
3. Войдите в систему

### 2. Загрузка ЭКГ
1. На главной странице нажмите "Загрузить ЭКГ"
2. Выберите файл с ЭКГ данными
3. Система автоматически проанализирует сигнал

### 3. Просмотр результатов
1. После анализа вы увидите:
   - Визуализацию ЭКГ сигнала
   - Предсказанный диагноз
   - Вероятности для каждого класса
   - Историю анализов

## Безопасность

- Пароли хешируются с помощью bcrypt с автоматической солью
- JWT токены с экспирацией
- Валидация всех входящих данных
- Проверка активности пользователя
- CORS настройки для фронтенда

## Тестирование

### Backend тесты
```bash
cd backend
python test_auth.py
python simple_api_test.py
```

### Frontend тесты
```bash
cd frontend
npm test
# или
pnpm test
```

## Документация API

После запуска сервера, документация доступна по адресу:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Production

### Backend
1. Установите production зависимости
2. Настройте PostgreSQL вместо SQLite
3. Установите Gunicorn для production
4. Настройте HTTPS
5. Настройте мониторинг и логирование

### Frontend
1. Соберите production версию:
```bash
npm run build
# или
pnpm build
```

2. Разверните на статическом хостинге (Netlify, Vercel и т.д.)

## Docker

### Backend Docker
```bash
cd backend
docker build -t ecg-backend .
docker run -p 8000:8000 ecg-backend
```

### Frontend Docker
```bash
cd frontend
docker build -t ecg-frontend .
docker run -p 3000:80 ecg-frontend
```

## Разработка

### Backend
- Запуск в режиме разработки: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Автоматическая перезагрузка при изменениях
- Логирование через стандартный Python logging

### Frontend
- Запуск в режиме разработки: `npm run dev` или `pnpm dev`
- Горячая перезагрузка при изменениях
- TypeScript проверка типов

## Поддержка

Для вопросов и поддержки:
- Проверьте документацию API
- Изучите примеры использования
- Создайте issue в репозитории

## Лицензия

[Укажите лицензию вашего проекта]

## Авторы

[Укажите авторов проекта]

## Благодарности

- FastAPI за отличный фреймворк
- React за мощный frontend
- PyTorch за возможности машинного обучения
- SQLAlchemy за удобную работу с базами данных