# Módulo de formulários

API interna para montar formulários, seções, perguntas, opções, membros e respostas.

## Decisões

- A ordem das perguntas é única e contínua dentro da seção. O README repete a frase das seções; a relação `belongsTo section` define a seção como contexto.
- A coluna física da ordem se chama `sort_order`. A API expõe o campo como `order`.
- `classification` se comporta como escolha única, igual a `radio` e `select`.
- `checkbox` aceita uma lista de opções.
- `short` e `long` não têm opções.
- Respostas só entram em formulário `published`.
- O criador vira `owner` na tabela `form_memberships`.
- O papel `member` visualiza o formulário e pode responder. Não edita estrutura nem membros.
- Administrador (`*`) ignora a membresia.
- O JSON de respostas é dado pessoal e fica criptografado. A lista não devolve esse conteúdo para quem não for o autor da resposta, o owner ou o administrador.
- Formulário, membresia e resposta usam soft-delete. Seção, pergunta e opção são removidas de fato e a ordem é recompactada.
