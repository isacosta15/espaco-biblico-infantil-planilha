---
name: Acessos e retenção
description: Decisões de segurança para separar o acesso administrativo e preservar registros excluídos.
---

O acesso administrativo deve usar uma entrada separada do login geral e ser validado no servidor pelo papel atual do usuário. Registros enviados à lixeira não devem ser removidos silenciosamente por uma rotina automática.

**Why:** A lixeira precisa permitir restauração sem abrir a área administrativa para usuários comuns, e a preservação evita que um prazo ou falha de rotina faça dados desaparecerem sem uma decisão explícita.

**How to apply:** Mantenha a distinção entre os portais geral e administrativo no cliente e no endpoint de autenticação; proteja listagem/restauração no servidor e exija uma ação administrativa explícita para qualquer remoção permanente futura.