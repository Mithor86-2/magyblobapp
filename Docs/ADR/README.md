# Architecture Decision Records (ADR)

Registro de las decisiones de arquitectura del proyecto. Cada ADR documenta una
decisión significativa, su contexto y sus consecuencias, de forma que un
evaluador (o el propio equipo en el futuro) entienda **por qué** el sistema es
como es, no solo cómo está construido.

Formato: variante del modelo de Michael Nygard
(_Título · Estado · Contexto · Decisión · Alternativas · Consecuencias_).

| #                                                    | Decisión                                          | Estado   |
| ---------------------------------------------------- | ------------------------------------------------- | -------- |
| [0001](0001-arquitectura-limpia-monorepo.md)         | Clean Architecture en un monorepo pnpm            | Aceptada |
| [0002](0002-tres-modos-de-ia.md)                     | Capa de IA con tres modos tras una sola interfaz  | Aceptada |
| [0003](0003-gemma-2b-llm-local-por-defecto.md)       | Gemma 2B como LLM local por defecto (vía Ollama)  | Aceptada |
| [0004](0004-base-de-datos-vectorial-chroma.md)       | Chroma como base de datos vectorial (condicional) | Aceptada |

## Estados posibles

- **Propuesta** — en discusión, aún no adoptada.
- **Aceptada** — decisión vigente.
- **Reemplazada** — sustituida por otra ADR (se enlaza).
- **Obsoleta** — ya no aplica.
