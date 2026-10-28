# API de Atividades da Mergington High School

Uma aplicação FastAPI super simples que permite que estudantes visualizem e se inscrevam em atividades extracurriculares.

## Funcionalidades

- Visualizar todas as atividades extracurriculares disponíveis
- Inscrever-se em atividades

## Primeiros Passos

1. Instale as dependências:

   ```
   pip install fastapi uvicorn
   ```

2. Execute a aplicação:

   ```
   python app.py
   ```

3. Abra seu navegador e acesse:
   - Documentação da API: http://localhost:8000/docs
   - Documentação alternativa: http://localhost:8000/redoc

## Endpoints da API

| Método | Endpoint                                                                                         | Descrição                                                                    |
| ------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| GET    | `/activities`                                                                                   | Obtém atividades e participantes com nome e email                           |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu&participantName=Ana`            | Inscreve um participante; `participantName` é obrigatório e aceita até 50 caracteres |
| DELETE | `/activities/{activity_name}/signup?email=student@mergington.edu`                                | Remove uma inscrição pelo email                                              |

## Modelo de Dados

A aplicação usa um modelo de dados simples com identificadores significativos:

1. **Activities** - Usa o nome da atividade como identificador:

   - Descrição
   - Horário
   - Número máximo de participantes permitidos
   - Lista de participantes inscritos, cada um com email e `participantName`

2. **Participant** - Usa email como identificador:
   - `participantName` obrigatório, com até 50 caracteres
   - Email

Todos os dados são armazenados em memória, o que significa que os dados serão resetados quando o servidor reiniciar.
