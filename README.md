# Local Orçamentos (Node.js + Excel)

Aplicação local para criar e gerar cotações com base no formulário (empresa, representante, fornecedor, data, validade, prazo de entrega, serviços, observações, especificações e itens).

Agora usando planilha Excel local como banco de dados (sem MySQL), Express + EJS para UI e geração de DOCX a partir de um template.

## Requisitos
- Node.js 18+
- (Opcional) MySQL — não é necessário na configuração padrão com Excel

## ConfiguraÃ§Ã£o
1) Copie o arquivo `.env.example` para `.env` e ajuste as variÃ¡veis:

```
cp .env.example .env
```

2) Crie o banco e as tabelas:

```
# ajuste usuÃ¡rio/senha/host no .env antes
mysql -u <usuario> -p < banco_vazio_opcional < db/schema.sql
```

3) Instale as dependÃªncias e rode a aplicaÃ§Ã£o:

```
npm install
npm start
```

4) Acesse
- http://localhost:3000/  (dashboard)
- http://localhost:3000/quotes/new  (nova cotaÃ§Ã£o)

## Estrutura
- `src/app.js` servidor Express, rotas e middlewares
- `src/db.js` conexÃ£o MySQL
- `src/routes/quotes.js` rotas para cotaÃ§Ãµes
- `views/` pÃ¡ginas EJS (layout, formulÃ¡rio, listagem, visualizaÃ§Ã£o)
- `public/` assets estÃ¡ticos (CSS)
- `uploads/` imagens enviadas (se houver)
- `db/schema.sql` criaÃ§Ã£o de banco e tabelas

## ObservaÃ§Ãµes
- Upload de imagens Ã© opcional (salvas em `uploads/`).
- â€œGerar orÃ§amentoâ€ cria uma pÃ¡gina de visualizaÃ§Ã£o com totais; vocÃª pode imprimir em PDF pelo navegador. Podemos integrar geraÃ§Ã£o de PDF mais tarde.
- Campos compatÃ­veis com seu webapp GAS: empresa, representante, fornecedor, data, validade, prazo, serviÃ§os (checkbox), observaÃ§Ãµes, especificaÃ§Ãµes (vÃ¡rias), itens (nome, preÃ§o).

