# Nexo — site (nexoassist.com)

Landing page do Nexo, assistente pessoal no WhatsApp. Publicada pelo GitHub Pages a partir da branch `main`, pasta raiz.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Textos e estrutura da página. No fim, o bloco `nexo-config` com os links de pagamento. |
| `assets/styles.css` | Visual: cores, tipografia, espaçamentos e movimento (três curvas: `--ease-out`, `--ease-in-out`, `--ease-drawer`). |
| `assets/app.js` | Comportamento: cena da abertura, demonstrações, planos, dúvidas e navegação. |
| `assets/boot.js` | Roda antes de a página aparecer (ativa as animações e bloqueia exibição dentro de outros sites). |
| `assets/vendor/lenis.min.js` | Rolagem suave da roda do mouse e do trackpad ([Lenis](https://github.com/darkroom-engineering/lenis) 1.3.23, licença MIT em `LENIS-LICENSE.txt`). Configuração em `assets/app.js` (`lerp: 0.15`). Desligada para quem prefere menos movimento. |
| `assets/fonts/` | Fontes do site, hospedadas aqui: Geist (títulos e texto) e Instrument Serif itálico (a palavra "mensagem."). Licença SIL OFL em `OFL.txt`. |
| `assets/logo.webp`, `assets/favicon.png`, `assets/maxmidia.webp` | Logotipo, ícone da aba e logo da maXmidia no rodapé. |
| `og-image.png` | Imagem de prévia quando o link é compartilhado (WhatsApp, redes sociais). |
| `robots.txt`, `sitemap.xml` | Informações para o Google. |
| `CNAME` | Domínio do site (nexoassist.com). Não apague. |
| `.nojekyll` | Faz o GitHub publicar os arquivos como estão. Não apague. |

## Editar no VS Code

1. Instale o [Git](https://git-scm.com/download/win) e o [VS Code](https://code.visualstudio.com/).
2. No VS Code, aperte `Ctrl+Shift+P`, digite **Git: Clone** e cole
   `https://github.com/contatomaxmidiamcz-a11y/nexo-site.git`. Escolha uma pasta e clique em **Abrir**.
   Se pedir, entre na sua conta do GitHub.
3. Instale a extensão **Live Server** (o VS Code sugere ao abrir a pasta). Clique com o botão direito no
   `index.html` › **Open with Live Server**: a prévia abre no navegador e atualiza a cada vez que você salva.
4. Para publicar: abra **Controle do Código-Fonte** (`Ctrl+Shift+G`), escreva uma mensagem curta
   (ex.: "Muda texto da manchete"), clique em **Commit** e depois em **Sincronizar alterações**.
   O site atualiza em 1–2 minutos. Se ainda aparecer a versão antiga, aperte `Ctrl+F5`.

## Trocar o link de pagamento

No fim do `index.html`, no bloco `nexo-config`, troque só os endereços entre aspas:

```json
{
  "pagamento": {
    "mensal": "https://pay.hotmart.com/...",
    "semestral": ""
  }
}
```

- Período vazio (`""`) fica oculto. Com os dois preenchidos, aparece o seletor Mensal/Semestral.
- Só são aceitos links `https` de `pay.hotmart.com` e `buy.stripe.com` (lista `ALLOWED_HOSTS` em `assets/app.js`).
- Ao mudar o preço, atualize também os textos de preço no `index.html` (seção Planos, dúvidas, `meta description`,
  tags `og:` e o bloco `application/ld+json`) e os valores em `plans` no `assets/app.js`.

## Segurança

- A página tem uma trava (linha `Content-Security-Policy` no `index.html`) que só executa scripts dos arquivos
  do próprio site. Por isso:
  - coloque código JavaScript em `assets/app.js`, não em `<script>` dentro do HTML (não vai rodar);
  - para usar um serviço de fora (Google Analytics, Meta Pixel etc.), o endereço dele precisa ser
    acrescentado nessa linha;
  - fontes só carregam dos arquivos do próprio site (`font-src 'self'`): para trocar de fonte, coloque o arquivo em `assets/fonts/`.
- Ative a verificação em duas etapas (2FA) no GitHub, na Hostinger e na conta Google.
- Em Settings › Pages deste repositório, mantenha **Enforce HTTPS** marcado.

## Google

- Ao fazer mudanças grandes, atualize a data em `<lastmod>` no `sitemap.xml`.
