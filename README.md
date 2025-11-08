# Financeiro Família — NuBlue v3

App web simples, focado em cards (sem rolagem lateral), com:
- Entradas por comissão com **dízimo automático de 10%** por entrada.
- Despesas fixas/variáveis (cards, tudo editável).
- Resumo com KPIs + **investimento sugerido** (até 30% do líquido; ajuste no slider).
- **Metas**: Serasa, 13º Thiago, Viagem e Reserva (pré-carregadas e editáveis).
- **Backup/Restore** em JSON (sem servidor).
- **PWA** (instalar na tela inicial).

## Atualizar no GitHub Pages
1. Faça download deste repositório (ou do ZIP gerado).
2. Suba os arquivos no seu repo (branch `main`).
3. Settings → Pages → Deploy from a branch (root).
4. Abra a URL no iPhone → Compartilhar → **Adicionar à Tela de Início**.

## Backup
- Exportar: aba **Backup** → Exportar backup → baixa `financeiro-backup.json`.
- Importar: selecione o arquivo e clique **Importar backup**.

## Observações
- Todos os dados ficam **no seu aparelho** (LocalStorage).
- O dízimo é **sempre 10%** do valor bruto de cada entrada.
