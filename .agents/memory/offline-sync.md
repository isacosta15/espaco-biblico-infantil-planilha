---
name: Sincronização offline
description: Regra do produto para preservar dados inseridos sem conexão.
---

Dados inseridos sem internet devem permanecer armazenados localmente até uma ação manual de sincronização; a aplicação não deve iniciar o envio automaticamente ao detectar Wi‑Fi.

**Why:** O fluxo precisa evitar perda de cadastros e permitir que a responsável decida quando é seguro enviar os dados, com aviso para não desligar a máquina durante o envio.

**How to apply:** Preserve operações que falharem na fila local, processe-as em ordem e só remova cada operação depois de uma resposta bem-sucedida do servidor.