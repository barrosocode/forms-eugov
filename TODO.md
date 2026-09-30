# Próximos passos

## Crítico

- [ ] Trocar a senha do usuário admin da API antes de qualquer uso fora do ambiente local
- [ ] Conferir `API_URL` de produção e servir o Next.js em HTTPS para o cookie `Secure`
- [ ] Revisar quem recebe `users:list`, porque só essa permissão permite buscar pessoas para adicionar a um formulário

## Importante

- [ ] Configurar CI para `npm test`, `npm run lint` e `npm run build`
- [ ] Tratar esqueci minha senha quando a API expuser esse fluxo
- [ ] Limitar tentativas de login no serviço de API

## Melhorias

- [ ] Reordenar seções e perguntas com arrastar e soltar
- [ ] Exportar respostas
- [ ] Tema claro e escuro com controle manual, além do `prefers-color-scheme`
