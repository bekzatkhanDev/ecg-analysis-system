# Как запустить Backend

## Проверка зависимостей

На основе анализа установленных пакетов, все необходимые зависимости для backend уже установлены:

### ✅ Основные зависимости (установлены):
- **FastAPI**: 0.135.0 ✅
- **uvicorn**: 0.41.0 ✅
- **pydantic**: 2.12.5 ✅
- **pydantic-settings**: 2.12.0 ✅
- **email-validator**: 2.3.0 ✅
- **python-jose**: 3.5.0 ✅
- **bcrypt**: 5.0.0 ✅
- **python-multipart**: 0.0.6 ✅
- **SQLAlchemy**: 2.0.47 ✅
- **torch**: 2.10.0 ✅
- **numpy**: 2.4.2 ✅

## Инструкция по запуску

### 1. Проверка текущей директории
```bash
cd c:\ecg-analysis-system\backend
```

### 2. Запуск сервера

#### Вариант A: Прямой запуск (рекомендуется)
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Вариант B: Использование uvicorn напрямую
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Вариант C: Без режима разработки
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Проверка работы

После запуска сервер должен быть доступен по адресу:
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

### 4. Тестирование

Для проверки работы можно запустить тесты:

```bash
# Тесты аутентификации
python test_auth.py

# Простые тесты API
python simple_api_test.py

# Отладка аутентификации
python debug_auth.py
```

## Конфигурация

### Создание .env файла
```bash
cp .env.example .env
```

### Рекомендуемые настройки для разработки
```bash
# .env
APP_NAME="ECG Analysis API"
DEBUG=true
SECRET_KEY="your-secret-key-for-development"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL="sqlite:///./ecg_analysis.db"
MODEL_WEIGHTS_PATH="best_model_500hz.pth"
MODEL_NUM_CLASSES=5
MODEL_SEQ_LEN=5000
MODEL_N_LEADS=12
```

## Проверка модели

Убедитесь, что файл модели присутствует:
```bash
ls -la best_model_500hz.pth
```

Если файл отсутствует, модель будет загружаться при первом запросе к `/api/ecg/analyze`.

## Возможные проблемы и решения

### Проблема 1: Импорт torch
Если возникают проблемы с PyTorch:
```bash
# Проверка установки PyTorch
python -c "import torch; print(torch.__version__)"
```

### Проблема 2: SQLAlchemy
Если возникают проблемы с базой данных:
```bash
# Проверка SQLAlchemy
python -c "import sqlalchemy; print(sqlalchemy.__version__)"
```

### Проблема 3: FastAPI
Если возникают проблемы с FastAPI:
```bash
# Проверка FastAPI
python -c "import fastapi; print(fastapi.__version__)"
```

## Docker (альтернативный способ)

### Сборка образа
```bash
docker build -t ecg-backend .
```

### Запуск контейнера
```bash
docker run -p 8000:8000 ecg-backend
```

## Логи и отладка

### Включение подробного логирования
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
```

### Проверка маршрутов
```bash
curl http://localhost:8000/health
```

## Типичный вывод при успешном запуске

```
INFO:     Will watch for changes in these directories: ['c:\\ecg-analysis-system\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [67890]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Production запуск

Для production рекомендуется:
1. Отключить режим разработки (`--reload`)
2. Использовать production WSGI сервер (например, gunicorn)
3. Настроить переменные окружения
4. Использовать PostgreSQL вместо SQLite

```bash
# Production запуск
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Поддержка

Если возникают проблемы:
1. Проверьте логи сервера
2. Убедитесь, что все зависимости установлены
3. Проверьте наличие файла модели
4. Проверьте настройки базы данных