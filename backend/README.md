# ECG Analysis Backend

## Обзор

Backend часть системы анализа ЭКГ, построенная на FastAPI с JWT аутентификацией, SQLite базой данных и PyTorch моделью для анализа ЭКГ сигналов.

## Особенности

- 🔐 JWT аутентификация с bcrypt хешированием паролей
- 📊 5-классовая классификация ЭКГ: NORM, MI, STTC, CD, HYP
- 🗄️ SQLite база данных с SQLAlchemy ORM
- 🤖 PyTorch модель (CNN + Transformer + Attention)
- 🛡️ Валидация данных и обработка ошибок
- 📝 Полная документация API через OpenAPI/Swagger

## Требования

- Python 3.10+
- PyTorch
- FastAPI
- SQLAlchemy
- python-jose
- bcrypt

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd ecg-analysis-system/backend
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Скачайте модель (если не включена):
```bash
# Модель должна быть в корне backend: best_model_500hz.pth
```

## Настройка

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Настройте параметры в `.env`:
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

## Запуск

### Локальный запуск
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker
```bash
docker build -t ecg-backend .
docker run -p 8000:8000 ecg-backend
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
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── auth.py      # Эндпоинты аутентификации
│   │   │   ├── ecg.py       # Эндпоинт анализа ЭКГ
│   │   │   └── users.py     # Эндпоинты пользователей
│   │   └── deps.py          # Зависимости FastAPI
│   ├── core/
│   │   ├── config.py        # Конфигурация приложения
│   │   └── security.py      # JWT и хеширование паролей
│   ├── db/
│   │   ├── base.py          # Базовый класс SQLAlchemy
│   │   └── models.py        # ORM модели
│   ├── models/
│   │   └── ecg_model.py     # PyTorch модель ЭКГ
│   ├── schemas/
│   │   ├── auth.py          # Pydantic схемы аутентификации
│   │   └── ecg.py           # Pydantic схемы ЭКГ
│   ├── services/
│   │   └── ml_service.py    # Сервис ML обработки
│   └── main.py              # Главный FastAPI приложение
├── requirements.txt
├── best_model_500hz.pth     # Веса PyTorch модели
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

## Безопасность

- Пароли хешируются с помощью bcrypt с автоматической солью
- JWT токены с экспирацией
- Валидация всех входящих данных
- Проверка активности пользователя
- CORS настройки для фронтенда

## Тестирование

Запустите тесты аутентификации:
```bash
python test_auth.py
```

Запустите тесты API эндпоинтов:
```bash
python simple_api_test.py
```

## Документация API

После запуска сервера, документация доступна по адресу:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Разработка

### Запуск в режиме разработки
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Автоматическая перезагрузка при изменениях
Сервер автоматически перезагружается при изменениях в коде.

### Логирование
Логирование настроено через стандартный Python logging.

## Production

### Переменные окружения
Обязательно установите в production:
- `SECRET_KEY` - Секретный ключ JWT (должен быть сложным)
- `DEBUG=false` - Отключить режим отладки
- `DATABASE_URL` - URL production базы данных

### Рекомендации
- Используйте PostgreSQL вместо SQLite
- Настройте HTTPS
- Установите мониторинг и логирование
- Настройте бэкапы базы данных

## Поддержка

Для вопросов и поддержки:
- Проверьте документацию API
- Изучите примеры использования
- Создайте issue в репозитории

## Лицензия

[Укажите лицензию вашего проекта]