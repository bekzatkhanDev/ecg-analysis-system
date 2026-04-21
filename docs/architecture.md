# Architecture Diagram — ECG Analysis System

```mermaid
flowchart TB
    classDef fe  fill:#0369a1,color:#fff,stroke:#0284c7
    classDef be  fill:#0f766e,color:#fff,stroke:#0d9488
    classDef ml  fill:#7c3aed,color:#fff,stroke:#8b5cf6
    classDef db  fill:#b45309,color:#fff,stroke:#d97706

    %% ══════════════════════════════════════════
    %%  LAYER 0 — Frontend  (Browser)
    %% ══════════════════════════════════════════
    subgraph Browser["  🖥️  Browser  "]
        direction LR

        subgraph Pages["Pages"]
            direction TB
            Login["LoginPage\n/login"]
            Dashboard["DashboardPage\n/"]
            Records["RecordsPage\n/records"]
        end

        subgraph Components["Components"]
            direction TB
            Upload["ECGUpload\n+ PatientSelector"]
            Chart["ECGChart\nChart.js · 12 leads"]
            Analysis["AnalysisDashboard\nRecharts · PDF export"]
            Diagnosis["DiagnosisForm"]
            Shell["AppShell · NavLink"]
        end

        subgraph Store["State  —  Zustand"]
            direction LR
            AnalysisStore["analysisStore\necgData · recordId\npatientId · diagnosis"]
            AuthStore["authStore\nuser · token"]
        end

        subgraph DataLayer["Data Layer"]
            direction LR
            QueryClient["React Query\ncaching · invalidation"]
            HttpClient["Axios apiClient\nBearer interceptor"]
        end
    end

    %% ══════════════════════════════════════════
    %%  LAYER 1 — Backend
    %% ══════════════════════════════════════════
    subgraph Backend["  ⚙️  FastAPI  —  Python 3.11  "]
        direction LR

        subgraph Endpoints["REST Endpoints  /api/…"]
            direction TB
            AuthRoute["POST /auth/login\nPOST /auth/register"]
            MeRoute["GET  /users/me"]
            AnalyzeRoute["POST /ecg/analyze"]
            RecordsRoute["GET  /ecg/records\nPATCH /ecg/records/{id}/diagnosis"]
            PatientsRoute["GET  /ecg/patients"]
        end

        subgraph Deps["Dependencies"]
            direction TB
            JwtAuth["JWT decode\nCurrentUser"]
            DbSession["SQLAlchemy Session\nDbSession"]
        end

        subgraph Service["Service"]
            ModelService["ModelService\nsingleton · lazy load"]
        end
    end

    %% ══════════════════════════════════════════
    %%  LAYER 2 — ML Pipeline
    %% ══════════════════════════════════════════
    subgraph MlPipeline["  🧠  PyTorch Model  —  CNN + Transformer  "]
        direction LR
        Cnn["1-D CNN\nFeature Extractor"]
        Transformer["Transformer\nEncoder\nmulti-head attention"]
        Classifier["Linear Classifier\n5 classes output"]
        Cnn --> Transformer --> Classifier
    end

    %% ══════════════════════════════════════════
    %%  LAYER 3 — Database
    %% ══════════════════════════════════════════
    subgraph Database["  🗄️  SQLite  "]
        direction LR
        UsersTable[("users\nid · email · role\nhashed password")]
        RecordsTable[("records\ndoctor · patient\nprobabilities · diagnosis")]
    end

    %% ══════════════════════════════════════════
    %%  EDGES
    %% ══════════════════════════════════════════
    Pages       --> Components
    Components  --> Store
    Store       --> QueryClient
    QueryClient --> HttpClient

    HttpClient  -- "HTTP REST\nmultipart/form-data" --> Endpoints

    Endpoints   --> JwtAuth
    Endpoints   --> DbSession
    AnalyzeRoute --> ModelService

    ModelService --> MlPipeline

    DbSession   --> UsersTable
    DbSession   --> RecordsTable

    %% ── Styles ─────────────────────────────────
    class Login,Dashboard,Records                fe
    class Upload,Chart,Analysis,Diagnosis,Shell  fe
    class AnalysisStore,AuthStore                fe
    class QueryClient,HttpClient                 fe
    class AuthRoute,MeRoute,AnalyzeRoute         be
    class RecordsRoute,PatientsRoute             be
    class JwtAuth,DbSession,ModelService         be
    class Cnn,Transformer,Classifier             ml
    class UsersTable,RecordsTable                db
```
